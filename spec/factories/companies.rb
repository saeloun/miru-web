# frozen_string_literal: true

FactoryBot.define do
  factory :company do
    name { "Saeloun" }
    address { Faker::Address.full_address }
    business_phone { Faker::PhoneNumber.cell_phone_in_e164 }
    base_currency { Faker::Currency.code }
    standard_price { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
    fiscal_year_end { Date::MONTHNAMES.sample }
    date_format { "DD-MM-YYYY" }
    country { "US" }
    timezone { Faker::Address.time_zone }

    trait :with_logo do
      after :build do |company|
        file_name = "test-image.png"
        file_path = Rails.root.join("spec", "support", "fixtures", file_name)
        company.logo.attach(io: File.open(file_path), filename: file_name, content_type: "image/png")
      end
    end
  end
end
