# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id               :bigint           not null, primary key
#  address_line_1   :string           not null
#  address_line_2   :string
#  address_type     :string           default("current")
#  addressable_type :string
#  city             :string           not null
#  country          :string           not null
#  pin              :string           not null
#  state            :string           not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  addressable_id   :bigint
#
# Indexes
#
#  index_addresses_on_addressable                   (addressable_type,addressable_id)
#  index_addresses_on_addressable_and_address_type  (addressable_type,addressable_id,address_type) UNIQUE
#
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
