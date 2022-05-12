# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_connected_account do
    association :company, factory: :company
    account_id { "123" }
  end
end
