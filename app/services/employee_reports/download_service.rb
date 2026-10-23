# frozen_string_literal: true

require "csv"

module EmployeeReports
  class DownloadService
    MAX_EMPLOYEES = 2_000

    def initialize(report:, month:, employments:)
      raise ArgumentError, "Month must use YYYY-MM" unless month.is_a?(String) && month.match?(/\A\d{4}-(0[1-9]|1[0-2])\z/)
      @month = Date.iso8601("#{month}-01")
      @report = report
      @company = report.company
      @employments = employments.includes(:employee_record, user: :addresses).order(:id).limit(MAX_EMPLOYEES + 1).to_a
      raise ArgumentError, "Report exceeds #{MAX_EMPLOYEES} active employees" if @employments.size > MAX_EMPLOYEES
    end

    def process
      values = monthly_values
      CSV.generate do |csv|
        csv << @report.columns.map { |key| Columns::DEFINITIONS.fetch(key).first }
        @employments.each do |employment|
          row = Row.new(employment:, month: @month, monthly_values: values)
          csv << @report.columns.map { |key| safe_cell(row.value(key)) }
        end
      end
    end

    private

      def monthly_values
        @user_ids = @employments.map(&:user_id)
        @report.columns.index_with do |key|
          case key
          when "recorded_time_off_minutes"
            TimeoffEntry.from_workspace(@company.id).where(user_id: @user_ids, leave_date: @month.all_month)
              .group(:user_id).sum(:duration)
          when "recorded_work_minutes"
            work_entries.group(:user_id).sum(:duration)
          when "recorded_working_days"
            work_entries.group(:user_id).distinct.count(:work_date)
          when "national_holiday_dates"
            @company.holiday_infos.kept.joins(:holiday).merge(Holiday.kept).national
              .where(date: @month.all_month).order(:date).distinct.pluck(:date).map(&:iso8601).to_json
          when "paid_reimbursements"
            reimbursements(:paid, :paid_at)
          when "approved_reimbursements"
            reimbursements(:approved, :approved_at)
          end
        end
      end

      def work_entries
        TimesheetEntry.kept.in_workspace(@company).where(user_id: @user_ids, work_date: @month.all_month)
      end

      def reimbursements(status, timestamp)
        start_at = @company.resolved_time_zone.local(@month.year, @month.month, 1)
        Expense.kept.personal.where(company_id: @company.id, user_id: @user_ids, status:)
          .where(timestamp => start_at...start_at.next_month).group(:user_id, :currency).sum(:amount)
          .each_with_object({}) do |((user_id, currency), amount), totals|
            (totals[user_id] ||= {})[currency] = amount
          end
      end

      def safe_cell(value)
        text = value.to_s
        text.match?(/\A[[:space:]]*[=+\-@]/) || text.start_with?("\t", "\r", "\n") ? "'#{text}" : text
      end
  end
end
