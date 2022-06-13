# frozen_string_literal: true

FactoryBot.define do
  factory :wise_account do
    profile_id { Faker::Number.number(digits: 7) }
    recipient_id { Faker::Number.number(digits: 7) }
    source_currency { "USD" }
    target_currency { "INR" }
    user { FactoryBot.create(:user) }
    company { FactoryBot.create(:company) }
  end
end
