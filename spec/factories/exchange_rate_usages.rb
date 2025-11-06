# frozen_string_literal: true

FactoryBot.define do
  factory :exchange_rate_usage do
    month { Date.current.beginning_of_month }
    requests_count { 0 }
    last_fetched_at { nil }

    trait :current_month do
      month { Date.current.beginning_of_month }
    end

    trait :last_month do
      month { 1.month.ago.beginning_of_month }
    end

    trait :low_usage do
      requests_count { 100 }
      last_fetched_at { 1.day.ago }
    end

    trait :approaching_limit do
      requests_count { 700 }
      last_fetched_at { 1.hour.ago }
    end

    trait :at_limit do
      requests_count { 1000 }
      last_fetched_at { 1.hour.ago }
    end

    trait :exceeded_limit do
      requests_count { 1050 }
      last_fetched_at { 1.hour.ago }
    end
  end
end
