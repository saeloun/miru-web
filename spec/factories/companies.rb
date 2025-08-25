# frozen_string_literal: true

# == Schema Information
#
# Table name: companies
#
#  id                  :bigint           not null, primary key
#  address             :text
#  bank_account_number :string
#  bank_name           :string
#  bank_routing_number :string
#  bank_swift_code     :string
#  base_currency       :string           default("USD"), not null
#  business_phone      :string
#  calendar_enabled    :boolean          default(TRUE)
#  country             :string           not null
#  date_format         :string
#  fiscal_year_end     :string
#  gst_number          :string
#  name                :string           not null
#  standard_price      :decimal(, )      default(0.0), not null
#  timezone            :string
#  vat_number          :string
#  working_days        :string           default("5")
#  working_hours       :string           default("40")
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  tax_id              :string
#
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
