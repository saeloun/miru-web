# frozen_string_literal: true

FactoryBot.define do
  factory :company do
    name { "Saeloun" }
    business_phone { Faker::PhoneNumber.cell_phone_in_e164.slice(0, 15) }
    base_currency { Faker::Currency.code }
    standard_price { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
    fiscal_year_end { "December" }
    date_format { "MM-DD-YYYY" }
    country { "US" }
    timezone { "Eastern Time (US & Canada)" }
    working_days { "5" }
    working_hours { "40" }

    after :create do |company|
      create(:address, addressable_type: "Company", addressable_id: company.id)
    end

    factory :company_with_invoices do
      transient do
        length { 5 }
      end

      clients { create_list(:client, 1) }
      invoices { Array.new(length) { create(:invoice, client: clients.first) } }
    end

    factory :india_company do
      name { "Saeloun Pvt. Ltd." }
      fiscal_year_end { "March" }
      date_format { "DD-MM-YYYY" }
      country { "IN" }
      timezone { "Asia/Kolkata" }
    end

    trait :with_logo do
      after :build do |company|
        file_name = "test-image.png"
        file_path = Rails.root.join("spec", "support", "fixtures", file_name)
        company.logo.attach(io: File.open(file_path), filename: file_name, content_type: "image/png")
      end
    end
  end
end
