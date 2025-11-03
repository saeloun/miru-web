# frozen_string_literal: true

FactoryBot.define do
  factory :currency_pair do
    from_currency { "USD" }
    to_currency { "EUR" }
    rate { 0.93 }
    active { true }
    last_updated_at { Time.current }

    trait :inactive do
      active { false }
    end

    trait :usd_to_eur do
      from_currency { "USD" }
      to_currency { "EUR" }
      rate { 0.93 }
    end

    trait :usd_to_gbp do
      from_currency { "USD" }
      to_currency { "GBP" }
      rate { 0.79 }
    end

    trait :eur_to_usd do
      from_currency { "EUR" }
      to_currency { "USD" }
      rate { 1.08 }
    end

    trait :gbp_to_usd do
      from_currency { "GBP" }
      to_currency { "USD" }
      rate { 1.27 }
    end

    trait :without_rate do
      rate { nil }
      last_updated_at { nil }
    end
  end
end
