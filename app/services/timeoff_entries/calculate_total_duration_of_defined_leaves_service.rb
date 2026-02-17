# frozen_string_literal: true

module TimeoffEntries
  class CalculateTotalDurationOfDefinedLeavesService < ApplicationService
    attr_reader :joining_date, :allocation_value, :allocation_period,
      :allocation_frequency, :passed_year, :working_hours_per_day,
      :working_days_per_week, :current_date, :current_year,
      :current_month, :current_week
    attr_accessor :leave_balance

    TOTAL_WEEKS = 52
    WEEKS_PER_MONTH = 4
    MONTHS_PER_QUARTER = 3
    QUARTERS_PER_YEAR = 4
    MONTHS_PER_YEAR = 12

    def initialize(joining_date, allocation_value, allocation_period,
      allocation_frequency, passed_year, working_hours_per_day,
      working_days_per_week)
      @joining_date = joining_date
      @allocation_value = allocation_value
      @allocation_period = allocation_period
      @allocation_frequency = allocation_frequency
      @passed_year = passed_year
      @working_hours_per_day = working_hours_per_day
      @working_days_per_week = working_days_per_week
      @current_date = Date.current
      @current_year = @current_date.year
      @current_month = @current_date.month
      @current_week = @current_date.cweek
    end

    def process
      total_duration = case allocation_frequency
                       when :per_week
                         calculate_days_per_week_leave_allocation
                       when :per_month
                         case allocation_period
                         when :days
                           calculate_days_per_month_leave_allocation
                         when :weeks
                           calculate_weeks_per_month_leave_allocation
                         end
                       when :per_quarter
                         case allocation_period
                         when :days
                           calculate_days_per_quarter_leave_allocation
                         when :weeks
                           calculate_weeks_per_quarter_leave_allocation
                         end
                       when :per_year
                         case allocation_period
                         when :days
                           calculate_days_per_year_leave_allocation
                         when :weeks
                           calculate_weeks_per_year_leave_allocation
                         when :months
                           calculate_months_per_year_leave_allocation
                         end
                       else
                         0
      end
      total_duration
    end

    def calculate_days_per_week_leave_allocation
      if passed_year == joining_date&.year
        weeks = passed_year == current_year ?
          current_week - joining_date.cweek : TOTAL_WEEKS - joining_date.cweek

        first_week_allocation_value = (joining_date.wday >= 3 && joining_date.wday <= 5) ?
          (allocation_value / 2) : allocation_value

        first_week_allocation_value + allocation_value * weeks
      elsif passed_year == current_year
        allocation_value * current_week
      else
        allocation_value * TOTAL_WEEKS
      end
    end

    def calculate_days_per_month_leave_allocation
      if passed_year == joining_date&.year
        first_month_allocation_value = allocation_value

        months = passed_year == current_year ?
          current_month - joining_date.month : MONTHS_PER_YEAR - joining_date.month

        first_month_allocation_value /= 2 if joining_date.day > 15

        months.zero? ? first_month_allocation_value
          : first_month_allocation_value + allocation_value * months
      elsif passed_year == current_year
        allocation_value * current_month
      else
        allocation_value * MONTHS_PER_YEAR
      end
    end

    def calculate_weeks_per_month_leave_allocation
      if passed_year == joining_date&.year
        first_month_allocation_value = allocation_value

        months = passed_year == current_year ?
          current_month - joining_date.month : MONTHS_PER_YEAR - joining_date.month

        first_month_allocation_value /= 2 if joining_date.day > 15

        first_month = first_month_allocation_value * @working_days_per_week

        months.zero? ? first_month
          : first_month + (allocation_value * @working_days_per_week * months)
      elsif passed_year == current_year
        allocation_value * @working_days_per_week * current_month
      else
        allocation_value * @working_days_per_week * MONTHS_PER_YEAR
      end
    end

    def calculate_days_per_quarter_leave_allocation
      current_quarter, _ = quarter_position_and_after_mid_quarter(current_date)
      if passed_year == joining_date&.year
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_quarter_allocation_value = allocation_value

        quarters = passed_year == current_year ?
          current_quarter - joining_date_quarter : QUARTERS_PER_YEAR - joining_date_quarter

        first_quarter_allocation_value = first_quarter_allocation_value /= 2 if is_joining_date_after_mid_quarter

        quarters <= 0 ? first_quarter_allocation_value : first_quarter_allocation_value + (allocation_value * quarters)
      elsif passed_year == current_year
        allocation_value * current_quarter
      else
        allocation_value * QUARTERS_PER_YEAR
      end
    end

    def calculate_weeks_per_quarter_leave_allocation
      current_quarter, _ = quarter_position_and_after_mid_quarter(current_date)
      if passed_year == joining_date&.year
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_quarter_allocation_value = allocation_value

        quarters = passed_year == current_year ?
          current_quarter - joining_date_quarter : QUARTERS_PER_YEAR - joining_date_quarter

        first_quarter_allocation_value = first_quarter_allocation_value /= 2 if is_joining_date_after_mid_quarter

        first_quarter = first_quarter_allocation_value * @working_days_per_week

        quarters <= 0 ? first_quarter :
          first_quarter + (allocation_value * @working_days_per_week * quarters)
      elsif passed_year == current_year
        allocation_value * @working_days_per_week * current_quarter
      else
        allocation_value * @working_days_per_week * QUARTERS_PER_YEAR
      end
    end

    def calculate_days_per_year_leave_allocation
      if passed_year == joining_date&.year
        joining_date.month > 6 ? allocation_value / 2 : allocation_value
      else
        allocation_value
      end
    end

    def calculate_weeks_per_year_leave_allocation
      total_days = allocation_value * @working_days_per_week
      if passed_year == joining_date&.year
        joining_date.month > 6 ? total_days / 2 : total_days
      else
        total_days
      end
    end

    def calculate_months_per_year_leave_allocation
      total_days = allocation_value * @working_days_per_week * WEEKS_PER_MONTH
      if passed_year == joining_date&.year
        joining_date.month > 6 ? total_days / 2 : total_days
      else
        total_days
      end
    end

    def quarter_position_and_after_mid_quarter(date)
      quarter = (date.month / 3.0).ceil
      mid_date = Date.new(date.year, (((quarter - 1) * 3) + 2), 15)

      after_mid_quarter = date > mid_date

      [quarter, after_mid_quarter]
    end
  end
end
