# frozen_string_literal: true

FactoryBot.define do
  factory :holiday do
    company
    year { 2023 }
    enable_optional_holidays { true }
    no_of_allowed_optional_holidays { 1 }
    holiday_types { ["national", "optional"] }
    time_period_optional_holidays { "per_quarter" }
  end
end
