# frozen_string_literal: true

FactoryBot.define do
  factory :employment_detail do
    company_user
    designation { "SDE" }
    employment_type { "Salaried" }
    joined_at { Faker::Date.between(from: "2020-01-01", to: "2021-01-01") }
    resigned_at {}
    employee_id { Faker::Alphanumeric.alphanumeric(number: 10, min_alpha: 3) }
  end
end
