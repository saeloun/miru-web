# frozen_string_literal: true

module TimeoffEntries
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :user_id, :year, :previous_year
    attr_accessor :leave_balance, :optional_timeoff_entries, :national_timeoff_entries

    def initialize(current_user, current_company, user_id, year)
      @current_user = current_user
      @current_company = current_company
      @user_id = user_id
      @year = year.to_i
      @leave_balance = []
      @previous_year = year.to_i - 1
    end

    def process
      {
        timeoff_entries:,
        employees:,
        leave_balance: process_leave_balance,
        total_timeoff_entries_duration: timeoff_entries.sum(&:duration),
        optional_timeoff_entries:,
        national_timeoff_entries:
      }
    end

    private

      def timeoff_entries
        start_date = Date.new(year, 1, 1)
        end_date = Date.new(year, 12, 31)

        @_timeoff_entries ||= TimeoffEntry.from_workspace(current_company.id)
          .where(user_id:)
          .during(start_date, end_date)
          .distinct
      end

      def employees
        @_employees ||= is_admin? ? current_company_users : [current_user]
      end

      def current_company_users
        current_company.employees_without_client_role.select(:id, :first_name, :last_name)
      end

      def is_admin?
        current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
      end

      def process_leave_balance
        calculate_leave_balance
        calculate_holiday_balance
        leave_balance
      end

      def calculate_leave_balance
        leave = current_company.leaves&.kept&.find_by(year:)
        return unless leave

        previous_year_leave = current_company.leaves.kept.find_by(year: previous_year)

        leave.leave_types.kept.all.each do |leave_type|
          total_leave_type_days = calculate_total_duration(leave_type, year)

          timeoff_entries_duration = leave_type&.timeoff_entries&.kept.where(user_id:).sum(:duration)

          previous_year_leave_type = previous_year_leave&.leave_types&.kept&.find_by(name: leave_type.name)

          previous_year_carryforward = calculate_previous_year_carryforward(previous_year_leave_type)

          net_duration = (total_leave_type_days * 8 * 60) + previous_year_carryforward - timeoff_entries_duration
          net_hours = net_duration / 60
          net_days = net_hours / 8
          extra_hours = net_hours % 8

          summary_object = {
            id: leave_type.id,
            name: leave_type.name,
            icon: leave_type.icon,
            color: leave_type.color,
            total_leave_type_days:,
            timeoff_entries_duration:,
            net_duration:,
            net_days:,
            type: "leave",
            label: "#{net_days} days #{extra_hours} hours"
          }

          leave_balance << summary_object
        end
      end

      def calculate_holiday_balance
        holiday = current_company.holidays.kept.find_by(year:)

        return unless holiday

        calculate_national_holiday_balance(holiday)
        calculate_optional_holiday_balance(holiday)
      end

      def calculate_national_holiday_balance(holiday)
        total_national_holidays = holiday.holiday_infos.national.count
        @national_timeoff_entries = holiday.national_timeoff_entries.where(user: user_id)

        national_holidays = {
          id: "national",
          name: "National Holidays",
          icon: "national",
          color: "national",
          timeoff_entries_duration: national_timeoff_entries.sum(:duration),
          type: "holiday",
          category: "national",
          label: "#{national_timeoff_entries.count} out of #{total_national_holidays}"
        }

        leave_balance << national_holidays
      end

      def calculate_optional_holiday_balance(holiday)
        no_of_allowed_optional_holidays = holiday.no_of_allowed_optional_holidays
        time_period_optional_holidays = holiday.time_period_optional_holidays
        @optional_timeoff_entries = holiday.optional_timeoff_entries.where(user: user_id)

        total_optional_entries = TimeoffEntries::CalculateOptionalHolidayTimeoffEntriesService.new(
          time_period_optional_holidays,
          holiday.optional_timeoff_entries,
          Date.current,
          user_id
        ).process

        if total_optional_entries >= no_of_allowed_optional_holidays
          net_days = 0
        else
          net_days = no_of_allowed_optional_holidays - total_optional_entries
        end

        optional_holidays = {
          id: "optional",
          name: "Optional Holidays",
          icon: "optional",
          color: "optional",
          net_duration: net_days * 60 * 8,
          net_days:,
          timeoff_entries_duration: optional_timeoff_entries.sum(:duration),
          type: "holiday",
          category: "optional",
          label: "#{total_optional_entries} out of #{no_of_allowed_optional_holidays} (this #{time_period_optional_holidays.to_s.gsub("per_", "")})"
        }

        leave_balance << optional_holidays
      end

      def calculate_total_duration(leave_type, passed_year)
        allocation_value = leave_type.allocation_value
        allocation_period = leave_type.allocation_period.to_sym
        allocation_frequency = leave_type.allocation_frequency.to_sym

        TimeoffEntries::CalculateTotalDurationOfDefinedLeavesService.new(
          user_joined_date,
          allocation_value,
          allocation_period,
          allocation_frequency,
          passed_year
        ).process
      end

      def user_joined_date
        employee_id = is_admin? ? user_id : current_user.id
        user = User.find(employee_id)
        user.joined_date_for_company(current_company)
      end

      def calculate_previous_year_carryforward(leave_type)
        return 0 unless leave_type

        last_year_carryover =
          Carryover.find_by(
            user_id:,
            company_id: current_company.id,
            leave_type_id: leave_type.id,
            from_year: previous_year
          )

        last_year_carryover && (last_year_carryover.duration > 0) ? last_year_carryover.duration : 0
      end
  end
end
