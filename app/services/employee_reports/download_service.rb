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
      CSV.generate do |csv|
        csv << @report.columns.map { |key| Columns::DEFINITIONS.fetch(key).first }
        @employments.each do |employment|
          row = Row.new(employment:, company: @company, month: @month)
          csv << @report.columns.map { |key| safe_cell(row.value(key)) }
        end
      end
    end

    private

      def safe_cell(value)
        text = value.to_s
        text.match?(/\A[[:space:]]*[=+\-@]/) || text.start_with?("\t", "\r", "\n") ? "'#{text}" : text
      end
  end
end
