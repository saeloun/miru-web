# frozen_string_literal: true

module TimeoffEntries
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :user_id, :year, :optional_timeoff_entries, :national_timeoff_entries
    attr_accessor :leave_balance

    CURRENT_DATE = DateTime.now
    CURRENT_YEAR = CURRENT_DATE.year
    CURRENT_MONTH = CURRENT_DATE.month
    CURRENT_WEEK = CURRENT_DATE.cweek

    def initialize(current_user, current_company, user_id, year)
      @current_user = current_user
      @current_company = current_company
      @user_id = user_id
      @year = year.to_i
      @leave_balance = []
    end

    def process
      {
        timeoff_entries:,
        employees:,
        leave_balance: process_leave_balance,
        total_timeoff_entries_duration: timeoff_entries.sum(:duration),
        optional_timeoff_entries:,
        national_timeoff_entries:
      }
    end

    private

      def timeoff_entries
        start_date = Date.new(year, 1, 1)
        end_date = Date.new(year, 12, 31)

        @_timeoff_entries ||= current_company.timeoff_entries.kept.includes([:leave_type], [:holiday_info])
          .where(user_id:)
          .where(leave_date: start_date..end_date)
          .order(leave_date: :desc)
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

      def calculate_total_duration(leave_type)
        allocation_value = leave_type.allocation_value
        allocation_period = leave_type.allocation_period
        allocation_frequency = leave_type.allocation_frequency

        hours_per_day = 8
        days_per_week = 5
        weeks_per_month = 4
        months_per_quarter = 3
        quarters_per_year = 4
        months_per_year = 12

        total_duration = case allocation_frequency.to_sym
                         when :per_week
                           calculate_days_per_week_leave_allocation(user_joined_date, allocation_value)
                         when :per_month
                           case allocation_period.to_sym
                           when :days
                             calculate_days_per_month_leave_allocation(user_joined_date, allocation_value)
                           when :weeks
                             allocation_value * days_per_week * months_per_year
                           end
                         when :per_quarter
                           case allocation_period.to_sym
                           when :days
                             calculate_days_per_quarter_leave_allocation(user_joined_date, allocation_value)
                           when :weeks
                             allocation_value * days_per_week * quarters_per_year
                           end
                         when :per_year
                           case allocation_period.to_sym
                           when :days
                             calculate_days_per_year_leave_allocation(user_joined_date, allocation_value)
                           when :weeks
                             allocation_value * days_per_week
                           when :months
                             allocation_value * days_per_week * weeks_per_month
                           end
                         else
                           0
        end
        total_duration
      end

      def calculate_days_per_month_leave_allocation(joining_date, allocation_value)
        first_month_allocation_value = allocation_value
        if joining_date && joining_date.year == CURRENT_YEAR
          total_month_duration = CURRENT_MONTH - joining_date.month
          first_month_allocation_value /= 2 if joining_date.day > 15
          total_month_duration.zero? ? first_month_allocation_value
           : first_month_allocation_value + allocation_value * total_month_duration
        else
          first_month_allocation_value * CURRENT_MONTH
        end
      end

      def calculate_days_per_week_leave_allocation(joining_date, allocation_value)
        if joining_date && joining_date.year == CURRENT_YEAR
          total_weeks = (CURRENT_WEEK - joining_date.cweek)
          first_week_allocation_value = (joining_date.wday >= 3 && joining_date.wday <= 5) ?
            (allocation_value / 2) : allocation_value
          first_week_allocation_value + allocation_value * total_weeks
        else
          allocation_value * CURRENT_WEEK
        end
      end

      def calculate_days_per_quarter_leave_allocation(joining_date, allocation_value)
        current_quarter = quarter_position_and_after_mid_quarter(CURRENT_DATE)
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_week_allocation_value = allocation_value

        if joining_date && joining_date.year == CURRENT_YEAR
          total_quarter = current_quarter[0] - joining_date_quarter
          first_week_allocation_value = allocation_value /= 2 if is_joining_date_after_mid_quarter
          first_week_allocation_value + allocation_value * total_quarter
        else
          allocation_value * current_quarter[0]
        end
      end

      def calculate_days_per_year_leave_allocation(joining_date, allocation_value)
        if joining_date && joining_date.year == CURRENT_YEAR
          joining_date.month > CURRENT_MONTH / 2 ? allocation_value / 2 : allocation_value
        else
          allocation_value
        end
      end

      def user_joined_date
        employee_id = is_admin? ? user_id : current_user.id
        user = User.find(employee_id)
        user.joined_date_for_company(current_company)
      end

      def quarter_position_and_after_mid_quarter(date)
        quarter = (date.month / 3.0).ceil
        mid_date = Date.new(date.year, (((quarter - 1) * 3) + 2), 15)

        after_mid_quarter = date > mid_date

        [quarter, after_mid_quarter]
      end

      def calculate_previous_year_carryforward(leave_type)
        return 0 unless leave_type

        total_leave_type_days = calculate_total_duration(leave_type)

        timeoff_entries_duration = leave_type.timeoff_entries.kept.where(user_id:).sum(:duration)

        net_duration = (total_leave_type_days * 8 * 60) - timeoff_entries_duration

        carry_forward_duration = leave_type.carry_forward_days * 8 * 60

        net_duration > carry_forward_duration ? carry_forward_duration : net_duration > 0 ? net_duration : 0
      end

      def calculate_leave_balance
        leave = current_company.leaves.kept.find_by(year: Date.current.year)
        return unless leave

        previous_year_leave = current_company.leaves.kept.find_by(year: leave.year - 1)

        leave.leave_types.kept.all.each do |leave_type|
          total_leave_type_days = calculate_total_duration(leave_type)

          timeoff_entries_duration = leave_type.timeoff_entries.kept.where(user_id:).sum(:duration)

          previous_year_leave_type = previous_year_leave &&
            previous_year_leave.leave_types.kept.find_by(name: leave_type.name)

          previous_year_carryforward = calculate_previous_year_carryforward(previous_year_leave_type)

          net_duration = (total_leave_type_days * 8 * 60) + previous_year_carryforward - timeoff_entries_duration

          summary_object = {
            id: leave_type.id,
            name: leave_type.name,
            icon: leave_type.icon,
            color: leave_type.color,
            total_leave_type_days:,
            timeoff_entries_duration:,
            net_duration:,
            net_days: net_duration / 60 / 8,
            type: "leave"
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
        national_timeoff_entries = holiday.national_timeoff_entries.where(user: user_id)

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
        optional_timeoff_entries = holiday.optional_timeoff_entries.where(user: user_id)

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
          label: "#{total_optional_entries} out of #{no_of_allowed_optional_holidays}"
        }

        leave_balance << optional_holidays
      end
  end
end
