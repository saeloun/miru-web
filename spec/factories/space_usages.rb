# frozen_string_literal: true

FactoryBot.define do
  factory :space_usage do
    company { nil }
    user { nil }
    space_code { 1 }
    purpose_code { 1 }
    start_duration { 1.5 }
    end_duration { 1.5 }
    work_date { "2022-07-08" }
    note { "MyText" }
    restricted { false }
  end
end
