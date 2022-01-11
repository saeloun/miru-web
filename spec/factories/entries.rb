# frozen_string_literal: true

FactoryBot.define do
  factory :entry do
    user
    project
    duration { 8.0 }
    note { "Did that" }
    work_date { "2022-01-11" }
  end
end
