# frozen_string_literal: true

FactoryBot.define do
  factory :address do
    address_line_1 { Faker::Address.full_address.slice(0, 50) }
    address_line_2 { Faker::Address.full_address.slice(0, 50) }
    state { Faker::Address.state }
    city { Faker::Address.city }
    country { "US" }
    pin { Faker::Address.postcode.slice(0, 10) }
    with_user

    trait :with_company do
      association(:addressable, factory: :company)
    end

    trait :with_client do
      association(:addressable, factory: :client)
    end

    trait :with_user do
      association(:addressable, factory: :user)
    end
  end
end
