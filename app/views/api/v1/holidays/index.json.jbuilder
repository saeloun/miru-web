# frozen_string_literal: true

json.holidays holidays do |holiday|
  json.id holiday.id
  json.year holiday.year
  json.enable_optional_holidays holiday.enable_optional_holidays
  json.no_of_allowed_optional_holidays holiday.no_of_allowed_optional_holidays
  json.holiday_types holiday.holiday_types
  json.time_period_optional_holidays holiday.time_period_optional_holidays

  json.national_holidays holiday.holiday_infos.kept.national.each do |holiday_info|
    json.id holiday_info.id
    json.date CompanyDateFormattingService.new(holiday_info.date, company: current_company).process
    json.name holiday_info.name
    json.category holiday_info.category
  end

  json.optional_holidays holiday.holiday_infos.kept.optional.each do |holiday_info|
    json.id holiday_info.id
    json.date CompanyDateFormattingService.new(holiday_info.date, company: current_company).process
    json.name holiday_info.name
    json.category holiday_info.category
  end
end
