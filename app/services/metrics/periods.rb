# frozen_string_literal: true

module Metrics
  class Periods < ApplicationService
    class << self
      def period_date_for(period, date)
        case period.to_s
        when "day"
          date.to_date
        when "week"
          date.beginning_of_week
        when "month"
          date.beginning_of_month
        when "quarter"
          date.beginning_of_quarter
        when "year"
          date.beginning_of_year
        when "all_time"
          nil
        else
          date.to_date
        end
      end

      def staleness_threshold(period)
        case period.to_s
        when "hour", "day"
          1.hour
        when "week"
          6.hours
        when "month"
          1.day
        when "quarter", "year"
          1.week
        when "all_time"
          1.day
        else
          1.hour
        end
      end

      def date_range(period, period_date)
        return if period.to_s == "all_time" || period_date.nil?

        case period.to_s
        when "day"
          period_date.beginning_of_day..period_date.end_of_day
        when "week"
          period_date.beginning_of_week..period_date.end_of_week
        when "month"
          period_date.beginning_of_month..period_date.end_of_month
        when "quarter"
          period_date.beginning_of_quarter..period_date.end_of_quarter
        when "year"
          period_date.beginning_of_year..period_date.end_of_year
        end
      end
    end
  end
end
