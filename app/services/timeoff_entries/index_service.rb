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
                           allocation_value * weeks_per_month * months_per_year
                         when :per_month
                           case allocation_period.to_sym
                           when :days
                             allocation_value * months_per_year
                           when :weeks
                             allocation_value * days_per_week * months_per_year
                           end
                         when :per_quarter
                           case allocation_period.to_sym
                           when :days
                             allocation_value * quarters_per_year
                           when :weeks
                             allocation_value * days_per_week * quarters_per_year
                           end
                         when :per_year
                           case allocation_period.to_sym
                           when :days
                             allocation_value
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
