# frozen_string_literal: true

FactoryBot.define do
  factory :company do
    name { "Saeloun" }
    address { Faker::Address.full_address }
    business_phone { Faker::PhoneNumber.cell_phone_in_e164 }
    base_currency { Faker::Currency.code }
    standard_price { Faker::Number.number }
    fiscal_year_end { Date::MONTHNAMES.sample }
    date_format { 0 }
    country { "USA" }
    timezone { "EST" }
  end
end
