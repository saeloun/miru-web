# frozen_string_literal: true

FactoryBot.define do
  factory :payments_provider do
    association :company, factory: :company
    sequence :name, %w(stripe paypal wise).cycle
    connected { false }
    enabled { false }
    accepted_payment_methods { ["card", "ach"] }
  end
end
