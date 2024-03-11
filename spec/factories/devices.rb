# frozen_string_literal: true

FactoryBot.define do
  factory :device do
    issued_to factory: :user
    issued_by factory: :company
    name { Faker::Alphanumeric.alphanumeric }
    serial_number { Faker::Alphanumeric.alphanumeric }
    is_insured { true }
    insurance_bought_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    insurance_expiry_date { Faker::Date.between(from: self.insurance_bought_date, to: Date.today) }
  end
end
