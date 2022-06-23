# frozen_string_literal: true

FactoryBot.define do
  factory :previous_employment do
    user
    company_name { Faker::Company.name }
    role { Faker::Company.profession }
  end
end
