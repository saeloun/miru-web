# frozen_string_literal: true

FactoryBot.define do
  factory :client do
    company
    name { Faker::Name.name }
    email { Faker::Internet.safe_email }
    phone { Faker::PhoneNumber.phone_number_with_country_code }
    address { Faker::Address.street_address }
    client_code { Faker::Alphanumeric.unique.alpha(number: 2).upcase }
  end
end
