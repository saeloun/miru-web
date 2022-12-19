# frozen_string_literal: true

FactoryBot.define do
  factory :employment do
    company
    user
    employee_id { Faker::Alphanumeric.alphanumeric(number: 10, min_alpha: 3) }
    designation { "SDE" }
    employment_type { "Salaried" }
    joined_at { Faker::Date.between(from: "2020-01-01", to: "2021-01-01") }
    resigned_at {}
    balance_pto { 0 }
    fixed_working_hours { 40 }
  end

  trait :part_time do
    fixed_working_hours { 20 }
  end

  trait :without_working_hours do
    fixed_working_hours { nil }
  end

  trait :without_balance_pto do
    balance_pto { nil }
  end
end
