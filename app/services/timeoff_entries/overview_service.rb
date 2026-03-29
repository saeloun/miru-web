# frozen_string_literal: true

module TimeoffEntries
  class OverviewService < ApplicationService
    include EmployeeFetchingConcern

    attr_reader :current_company, :current_user, :user_id, :year

    def initialize(current_user, current_company, user_id, year)
      @current_user = current_user
      @current_company = current_company
      @user_id = user_id
      @year = year.to_i
    end

    def process
      balance_summary = TimeoffEntries::BalanceSummaryService.process(
        current_user:,
        current_company:,
        user_id:,
        year:
      )

      {
        timeoff_entries:,
        employees: set_employees,
        leave_balance: balance_summary[:leave_balance],
        total_timeoff_entries_duration: timeoff_entries.sum(&:duration),
        optional_timeoff_entries: balance_summary[:optional_timeoff_entries],
        national_timeoff_entries: balance_summary[:national_timeoff_entries]
      }
    end

    private

      def timeoff_entries
        start_date = Date.new(year, 1, 1)
        end_date = Date.new(year, 12, 31)

        @_timeoff_entries ||= TimeoffEntry.from_workspace(current_company.id)
          .includes(:leave_type, :holiday_info, :custom_leave)
          .where(user_id:)
          .during(start_date, end_date)
          .distinct
      end
  end
end
