# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.first_name }
    email { Faker::Internet.safe_email }
    password { Faker::Internet.password }
    role { User.roles.values.sample }
    company_id { Company.first.id }
  end
end
