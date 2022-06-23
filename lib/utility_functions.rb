# frozen_string_literal: true

module UtilityFunctions
  def range_from_timeframe(timeframe)
    case timeframe
    when "last_week"
      1.weeks.ago.beginning_of_week..1.weeks.ago.end_of_week
    when "month", "this_month"
      0.month.ago.beginning_of_month..0.month.ago.end_of_month
    when "last_month"
      1.month.ago.beginning_of_month..1.month.ago.end_of_month
    when "year"
      0.year.ago.beginning_of_year..0.year.ago.end_of_year
    else
      0.weeks.ago.beginning_of_week..0.weeks.ago.end_of_week
    end
  end
end
