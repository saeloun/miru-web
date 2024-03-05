# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    company
    sender { build(:user) }
    first_name { Faker::Name.first_name.gsub(/\W/, "") }
    last_name { Faker::Name.last_name.gsub(/\W/, "") }
    recipient_email { Faker::Internet.email }
    role { "employee" }
    token { Faker::Lorem.characters(number: 10) }
    expired_at { Date.current + 1.day }
  end
end
