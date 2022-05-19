# frozen_string_literal: true

FactoryBot.define do
  factory :stripe_connected_account do
    association :company, factory: :company
    account_id { "acct_#{Faker::Alphanumeric.unique.alphanumeric(number: 16)}" }
  end
end
