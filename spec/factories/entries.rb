# frozen_string_literal: true

FactoryBot.define do
  factory :entry do
    duration { 8.0 }
    note { "MyText" }
    work_date { "2022-01-11" }
  end
end
