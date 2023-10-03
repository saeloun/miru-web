# frozen_string_literal: true

FactoryBot.define do
  factory :holiday_info do
    holiday
    name { "New Year" }
    date { "2023-01-01" }
    category { "national" }
  end
end
