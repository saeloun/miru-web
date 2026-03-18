# frozen_string_literal: true

module TimeoffEntries
  class BalanceSummaryService < ApplicationService
    include EmployeeFetchingConcern

    attr_reader :current_company, :current_user, :user_id, :year, :previous_year

    def initialize(current_user:, current_company:, user_id:, year:)
      @current_user = current_user
      @current_company = current_company
      @user_id = user_id
      @year = year.to_i
      @previous_year = @year - 1
      @working_days_per_week = current_company.working_days.to_i
      @working_hours_per_day = working_hours_per_day
      @leave_balance = []
    end

    def process
      calculate_leave_balance
      calculate_custom_leave_entries
      calculate_holiday_entries

      {
        leave_balance: @leave_balance,
        optional_timeoff_entries: @optional_timeoff_entries,
        national_timeoff_entries: @national_timeoff_entries
      }
    end

    private

      def calculate_leave_balance
        leave = current_company.leaves.kept.find_by(year:)
        return unless leave

        previous_year_leave = current_company.leaves.kept.find_by(year: previous_year)

        leave.leave_types.kept.find_each do |leave_type|
          total_leave_type_days = calculate_total_duration(leave_type, year)
          timeoff_entries_duration = leave_type.timeoff_entries.kept.where(user_id:).sum(:duration)
          previous_year_leave_type = previous_year_leave&.leave_types&.kept&.find_by(name: leave_type.name)
          previous_year_carryforward = calculate_previous_year_carryforward(previous_year_leave_type)
          total_minutes = total_leave_type_days * @working_hours_per_day * 60
          net_duration = total_minutes + previous_year_carryforward - timeoff_entries_duration
          net_hours = net_duration / 60
          net_days = net_hours / @working_hours_per_day
          label = TimeoffEntries::LeaveBalanceLabelService.process(net_hours, @working_hours_per_day)

          @leave_balance << {
            id: leave_type.id,
            name: leave_type.name,
            icon: leave_type.icon,
            color: leave_type.color,
            total_leave_type_days:,
            timeoff_entries_duration:,
            net_duration:,
            net_days:,
            type: "leave",
            label:
          }
        end
      end

      def calculate_custom_leave_entries
        leave = current_company.leaves.kept.find_by(year:)
        @leave_balance.concat(
          TimeoffEntries::CustomLeaveBalanceService.process(
            leave:,
            user_id:,
            working_hours_per_day: @working_hours_per_day,
            working_days_per_week: @working_days_per_week
          )
        )
      end

      def calculate_holiday_entries
        holiday = current_company.holidays.kept.find_by(year:)
        result = TimeoffEntries::HolidayBalanceService.process(
          holiday:,
          user_id:,
          working_hours_per_day: @working_hours_per_day
        )
        @optional_timeoff_entries = result[:optional_timeoff_entries]
        @national_timeoff_entries = result[:national_timeoff_entries]
        @leave_balance.concat(result[:leave_balance])
      end

      def calculate_total_duration(leave_type, passed_year)
        TimeoffEntries::CalculateTotalDurationOfDefinedLeavesService.new(
          user_joined_date,
          leave_type.allocation_value,
          leave_type.allocation_period.to_sym,
          leave_type.allocation_frequency.to_sym,
          passed_year,
          @working_hours_per_day,
          @working_days_per_week,
        ).process
      end

      def user_joined_date
        employee_id = admin? ? user_id : current_user.id
        user = User.find(employee_id)
        user.employments.kept.find_by(company_id: current_company.id)&.joined_at
      end

      def calculate_previous_year_carryforward(leave_type)
        return 0 unless leave_type

        last_year_carryover = Carryover.find_by(
          user_id:,
          company_id: current_company.id,
          leave_type_id: leave_type.id,
          from_year: previous_year
        )

        last_year_carryover&.duration.to_i.positive? ? last_year_carryover.duration : 0
      end

      def working_hours_per_day
        return 0 if current_company.working_hours.to_i.zero?

        current_company.working_hours.to_i / current_company.working_days.to_i
      end
  end
end
