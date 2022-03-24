# frozen_string_literal: true

FactoryBot.define do
  factory :client do
    company
    name { Faker::Name.name }
    email { Faker::Internet.unique.safe_email }
    phone { Faker::PhoneNumber.phone_number_with_country_code }
    address { Faker::Address.street_address }
    factory :client_with_invoices do
      invoices { Array.new(5) { association(:invoice) } }
    end
  end
end
