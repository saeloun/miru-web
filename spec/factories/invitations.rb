# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    company
    sender { build(:user) }
    recipient_email { Faker::Internet.safe_email }
    role { "employee" }
    token { Faker::String.random(length: 10) }
    expired_at { Date.current + 1.day }
  end
end
