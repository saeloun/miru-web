# frozen_string_literal: true

class DateRangeService
  attr_reader :timeframe, :from, :to

  class InvalidDatePassed < StandardError
    def message
      "Date value passed is invalid"
    end
  end

  def initialize(timeframe:, from: nil, to: nil)
    @timeframe = timeframe
    @from = from
    @to = to
  end

  def process
    case timeframe
    when "last_week"
      1.weeks.ago.beginning_of_week..1.weeks.ago.end_of_week
    when "week", "this_week"
      0.weeks.ago.beginning_of_week..0.weeks.ago.end_of_week
    when "month", "this_month"
      0.month.ago.beginning_of_month..0.month.ago.end_of_month
    when "last_month"
      1.month.ago.beginning_of_month..1.month.ago.end_of_month
    when "year"
      0.year.ago.beginning_of_year..0.year.ago.end_of_year
    when "custom"
      return convert_to_date(from)..convert_to_date(to) if from && to

      0.year.ago.beginning_of_year..0.year.ago.end_of_year
    else
      0.year.ago.beginning_of_year..0.year.ago.end_of_year
    end
  end

  private

    def convert_to_date(value)
      raise InvalidDatePassed if value.nil?

      Date.parse(value)
    end
end
