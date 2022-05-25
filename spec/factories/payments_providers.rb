# frozen_string_literal: true

FactoryBot.define do
  factory :payments_provider do
    association :company, factory: :company
    name { %w(stripe, paypal, wise).sample }
    connected { false }
    enabled { false }
    accepted_payment_methods { %(card) }
  end
end
