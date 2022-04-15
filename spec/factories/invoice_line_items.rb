# frozen_string_literal: true

FactoryBot.define do
  factory :invoice_line_item do
    name { Faker::Name.name }
    description { Faker::Alphanumeric.alpha(number: 20) }
    date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    rate { Faker::Number.between(from: 0, to: 1000) }
    quantity { Faker::Number.between(from: 1, to: 10) }
    invoice
    timesheet_entry
  end
end
