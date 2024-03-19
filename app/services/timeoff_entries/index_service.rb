# frozen_string_literal: true

module TimeoffEntries
  class IndexService < ApplicationService
    attr_reader :current_company, :current_user, :user_id, :year

    def initialize(current_user, current_company, user_id, year)
      @current_user = current_user
      @current_company = current_company
      @user_id = user_id
      @year = year.to_i
    end

    def process
      {
        timeoff_entries:,
        employees:,
        leave_balance:,
        total_timeoff_entries_duration: timeoff_entries.sum(:duration)
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

      def leave_balance
        leave_balance = []

        leave = current_company.leaves.kept.find_by(year:)

        if leave
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
              net_days: net_duration / 60 / 8
            }

            leave_balance << summary_object
          end
        end

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
        current_date = DateTime.now
        current_year = current_date.year
        current_month = current_date.month

        first_month_allocation_value = allocation_value
        if joining_date && joining_date.year == current_year
          total_month_duration = current_month - joining_date.month
          first_month_allocation_value /= 2 if joining_date.day > 15
          total_month_duration.zero? ? first_month_allocation_value
           : first_month_allocation_value + allocation_value * total_month_duration
        else
          first_month_allocation_value * current_month
        end
      end

      def calculate_days_per_week_leave_allocation(joining_date, allocation_value)
        current_date = Date.today
        current_week = current_date.cweek

        if joining_date && joining_date.year == current_date.year
          total_weeks = (current_week - joining_date.cweek)
          first_week_allocation_value = (joining_date.wday >= 3 && joining_date.wday <= 5) ?
            (allocation_value / 2) : allocation_value
          first_week_allocation_value + allocation_value * total_weeks
        else
          allocation_value * current_week
        end
      end

      def calculate_days_per_quarter_leave_allocation(joining_date, allocation_value)
        current_date = Date.today
        current_quarter = quarter_position_and_after_mid_quarter(current_date)
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_week_allocation_value = allocation_value

        if joining_date && joining_date.year == current_date.year
          total_quarter = current_quarter[0] - joining_date_quarter
          first_week_allocation_value = allocation_value /= 2 if is_joining_date_after_mid_quarter
          first_week_allocation_value + allocation_value * total_quarter
        else
          allocation_value * current_quarter[0]
        end
      end

      def calculate_days_per_year_leave_allocation(joining_date, allocation_value)
        current_date = DateTime.now
        current_year = current_date.year
        current_month = current_date.month

        if joining_date && joining_date.year == current_year
          joining_date.month > current_month / 2 ? allocation_value / 2 : allocation_value
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
        case date.month
        when 1..3
          quarter = 1
          mid_date = Date.new(date.year, 1, 1) + 1.month + 15.days # January 15th
        when 4..6
          quarter = 2
          mid_date = Date.new(date.year, 4, 1) + 1.month + 15.days # April 15th
        when 7..9
          quarter = 3
          mid_date = Date.new(date.year, 7, 1) + 1.month + 15.days # July 15th
        when 10..12
          quarter = 4
          mid_date = Date.new(date.year, 10, 1) + 1.month + 15.days # October 15th
        end

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
  end
end
