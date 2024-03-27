# frozen_string_literal: true

module TimeoffEntries
  class CalculateOptionalHolidayTimeoffEntriesService < ApplicationService
    attr_reader :time_period, :optional_timeoff_entries, :leave_date, :user

    def initialize(time_period, optional_timeoff_entries, leave_date, user)
      @time_period = time_period
      @optional_timeoff_entries = optional_timeoff_entries
      @leave_date = leave_date
      @user = user
    end

    def process
      case time_period.to_sym
      when :per_week
        start_of_week = leave_date.beginning_of_week
        end_of_week = leave_date.end_of_week

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_week..end_of_week,
          user:).count
      when :per_month
        start_of_month = leave_date.beginning_of_month
        end_of_month = leave_date.end_of_month

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_month..end_of_month,
          user:).count
      when :per_quarter
        start_of_quarter = leave_date.beginning_of_quarter
        end_of_quarter = leave_date.end_of_quarter

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_quarter..end_of_quarter,
          user:).count
      when :per_year
        total_optional_entries = optional_timeoff_entries.where(user:).count
      end
      total_optional_entries
    end
  end
end
