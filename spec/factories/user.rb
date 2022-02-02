# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name.gsub(/\W/, "") }
    last_name { Faker::Name.last_name.gsub(/\W/, "") }
    email { Faker::Internet.safe_email }
    password { Faker::Internet.password }
  end
end
