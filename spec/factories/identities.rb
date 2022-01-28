# frozen_string_literal: true

FactoryBot.define do
  factory :identity do
    provider { %w[google_oauth2].sample }
    uid { Faker::Number.number(digits: 20) }
    user
  end
end
