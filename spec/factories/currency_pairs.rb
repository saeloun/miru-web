# frozen_string_literal: true

FactoryBot.define do
  factory :currency_pair do
    from_currency { "USD" }
    to_currency { "EUR" }
    rate { 0.93 }
    active { true }
  end
end
