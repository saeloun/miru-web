# frozen_string_literal: true

FactoryBot.define do
  factory :previous_employment_detail do
    user
    employment_detail
    company_name { Faker::Company.name }
    role { Faker::Company.profession }
  end
end
