# frozen_string_literal: true

module TimeoffEntries
  class CalculateTotalDurationOfDefinedLeavesService < ApplicationService
    attr_reader :joining_date, :allocation_value, :allocation_period, :allocation_frequency, :passed_year
    attr_accessor :leave_balance

    CURRENT_DATE = DateTime.now
    CURRENT_YEAR = CURRENT_DATE.year
    CURRENT_MONTH = CURRENT_DATE.month
    CURRENT_WEEK = CURRENT_DATE.cweek
    TOTAL_WEEKS = 52
    HOURS_PER_DAY = 8
    DAYS_PER_WEEK = 5
    WEEKS_PER_MONTH = 4
    MONTHS_PER_QUARTER = 3
    QUARTERS_PER_YEAR = 4
    MONTHS_PER_YEAR = 12

    def initialize(joining_date, allocation_value, allocation_period, allocation_frequency, passed_year)
      @joining_date = joining_date
      @allocation_value = allocation_value
      @allocation_period = allocation_period
      @allocation_frequency = allocation_frequency
      @passed_year = passed_year
    end

    def process
      puts "______________________________________________________________________-"
      puts "calucalte leave type service"
      puts CURRENT_DATE
      puts CURRENT_YEAR
      puts CURRENT_MONTH
      puts CURRENT_WEEK

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
      puts "Total Duration Calculated"
      puts total_duration
      total_duration
    end

    def calculate_days_per_week_leave_allocation
      if passed_year == joining_date&.year
        weeks = passed_year == CURRENT_YEAR ?
          CURRENT_WEEK - joining_date.cweek : TOTAL_WEEKS - joining_date.cweek

        first_week_allocation_value = (joining_date.wday >= 3 && joining_date.wday <= 5) ?
          (allocation_value / 2) : allocation_value

        first_week_allocation_value + allocation_value * weeks
      elsif passed_year == CURRENT_YEAR
        allocation_value * CURRENT_WEEK
      else
        allocation_value * TOTAL_WEEKS
      end
    end

    def calculate_days_per_month_leave_allocation
      if passed_year == joining_date&.year
        first_month_allocation_value = allocation_value

        months = passed_year == CURRENT_YEAR ?
          CURRENT_MONTH - joining_date.month : MONTHS_PER_YEAR - joining_date.month

        first_month_allocation_value /= 2 if joining_date.day > 15

        months.zero? ? first_month_allocation_value
          : first_month_allocation_value + allocation_value * months
      elsif passed_year == CURRENT_YEAR
        allocation_value * CURRENT_MONTH
      else
        allocation_value * MONTHS_PER_YEAR
      end
    end

    def calculate_weeks_per_month_leave_allocation
      if passed_year == joining_date&.year
        first_month_allocation_value = allocation_value

        months = passed_year == CURRENT_YEAR ?
          CURRENT_MONTH - joining_date.month : MONTHS_PER_YEAR - joining_date.month

        first_month_allocation_value /= 2 if joining_date.day > 15

        first_month = first_month_allocation_value * DAYS_PER_WEEK

        months.zero? ? first_month
          : first_month + (allocation_value * DAYS_PER_WEEK * months)
      elsif passed_year == CURRENT_YEAR
        allocation_value * DAYS_PER_WEEK * CURRENT_MONTH
      else
        allocation_value * DAYS_PER_WEEK * MONTHS_PER_YEAR
      end
    end

    def calculate_days_per_quarter_leave_allocation
      current_quarter, after_mid_quarter = quarter_position_and_after_mid_quarter(CURRENT_DATE)
      if passed_year == joining_date&.year
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_quarter_allocation_value = allocation_value

        quarters = passed_year == CURRENT_YEAR ?
          current_quarter - joining_date_quarter : QUARTERS_PER_YEAR - joining_date_quarter

        first_quarter_allocation_value = first_quarter_allocation_value /= 2 if is_joining_date_after_mid_quarter

        quarters <= 0 ? first_quarter_allocation_value : first_quarter_allocation_value + (allocation_value * quarters)
      elsif passed_year == CURRENT_YEAR
        allocation_value * current_quarter
      else
        allocation_value * QUARTERS_PER_YEAR
      end
    end

    def calculate_weeks_per_quarter_leave_allocation
      current_quarter, after_mid_quarter = quarter_position_and_after_mid_quarter(CURRENT_DATE)
      if passed_year == joining_date&.year
        joining_date_quarter, is_joining_date_after_mid_quarter = quarter_position_and_after_mid_quarter(joining_date)
        first_quarter_allocation_value = allocation_value

        quarters = passed_year == CURRENT_YEAR ?
          current_quarter - joining_date_quarter : QUARTERS_PER_YEAR - joining_date_quarter

        first_quarter_allocation_value = first_quarter_allocation_value /= 2 if is_joining_date_after_mid_quarter

        first_quarter = first_quarter_allocation_value * DAYS_PER_WEEK

        quarters <= 0 ? first_quarter :
          first_quarter + (allocation_value * DAYS_PER_WEEK * quarters)
      elsif passed_year == CURRENT_YEAR
        allocation_value * DAYS_PER_WEEK * current_quarter
      else
        allocation_value * DAYS_PER_WEEK * QUARTERS_PER_YEAR
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
      total_days = allocation_value * DAYS_PER_WEEK
      if passed_year == joining_date&.year
        joining_date.month > 6 ? total_days / 2 : total_days
      else
        total_days
      end
    end

    def calculate_months_per_year_leave_allocation
      total_days = allocation_value * DAYS_PER_WEEK * WEEKS_PER_MONTH
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
