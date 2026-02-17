# frozen_string_literal: true

# == Schema Information
#
# Table name: exchange_rates
#
#  id            :bigint           not null, primary key
#  date          :date             not null
#  from_currency :string           not null
#  rate          :decimal(18, 10)  not null
#  source        :string           default("manual")
#  to_currency   :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
# Indexes
#
#  idx_exchange_rates_unique                              (from_currency,to_currency,date) UNIQUE
#  index_exchange_rates_on_date                           (date)
#  index_exchange_rates_on_from_currency_and_to_currency  (from_currency,to_currency)
#
FactoryBot.define do
  factory :exchange_rate do
    from_currency { "EUR" }
    to_currency { "USD" }
    rate { 1.18 }
    date { Date.current }
    source { "api" }

    trait :manual do
      source { "manual" }
    end

    trait :historical do
      date { 30.days.ago }
    end

    trait :eur_to_usd do
      from_currency { "EUR" }
      to_currency { "USD" }
      rate { 1.18 }
    end

    trait :gbp_to_usd do
      from_currency { "GBP" }
      to_currency { "USD" }
      rate { 1.35 }
    end

    trait :jpy_to_usd do
      from_currency { "JPY" }
      to_currency { "USD" }
      rate { 0.0068 }
    end

    trait :usd_to_eur do
      from_currency { "USD" }
      to_currency { "EUR" }
      rate { 0.85 }
    end
  end
end
