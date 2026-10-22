# frozen_string_literal: true

module EmployeeReports
  class Row
    def initialize(employment:, company:, month:)
      @employment = employment
      @company = company
      @month = month
      @user = employment.user
    end

    def value(key)
      return private_details[key].is_a?(Array) ? private_details[key].to_json : private_details[key] if EmployeeRecord::DETAIL_KEYS.include?(key)
      return @employment.public_send(key) if %w[employee_id designation employment_type joined_at].include?(key)
      return @user.public_send(key) if %w[email date_of_birth phone personal_email_id].include?(key)

      public_send(key)
    end

    def name
      [@user.first_name, @user.last_name].join(" ")
    end

    def addresses
      @user.addresses.map { |address| address.slice(:address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin) }.to_json
    end

    def social_accounts
      @user.social_accounts.to_json
    end

    def recorded_time_off_minutes
      TimeoffEntry.from_workspace(@company.id).where(user_id: @user.id, leave_date: @month.all_month).sum(:duration)
    end

    def recorded_work_minutes
      TimesheetEntry.kept.in_workspace(@company).where(user_id: @user.id,
        work_date: @month.all_month).sum(:duration)
    end

    def calendar_weekdays
      @month.all_month.count do |date|
        date.on_weekday? && date >= @employment.joined_at && (@employment.resigned_at.nil? || date <= @employment.resigned_at)
      end
    end

    def recorded_working_days
      TimesheetEntry.kept.in_workspace(@company).where(user_id: @user.id,
        work_date: @month.all_month).distinct.count(:work_date)
    end

    def national_holiday_dates
      @company.holiday_infos.kept.joins(:holiday).merge(Holiday.kept).national
        .where(date: @month.all_month).order(:date).distinct.pluck(:date).map(&:iso8601).to_json
    end

    def paid_reimbursements
      reimbursements(:paid, :paid_at)
    end

    def approved_reimbursements
      reimbursements(:approved, :approved_at)
    end

    private

      def private_details
        @private_details ||= (@employment.employee_record || @employment.build_employee_record).details_with_defaults
      end

      def reimbursements(status, timestamp)
        zone = @company.resolved_time_zone
        start_at = zone.local(@month.year, @month.month, 1)
        Expense.kept.personal.where(company_id: @company.id, user_id: @user.id, status:)
          .where(timestamp => start_at...start_at.next_month).group(:currency).sum(:amount)
          .transform_values { |amount| format("%.2f", amount) }.sort.to_h.to_json
      end
  end
end
