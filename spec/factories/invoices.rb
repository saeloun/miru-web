# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    issue_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    due_date { Faker::Date.between(from: self.issue_date, to: Date.today) }
    invoice_number { Faker::Alphanumeric.alphanumeric(number: 10) }
    reference { Faker::Invoice.reference }
    amount { Faker::Number.decimal(r_digits: 2) }
    outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    sub_total { Faker::Number.decimal(r_digits: 2) }
    tax { Faker::Number.decimal(r_digits: 2) }
    amount_paid { Faker::Number.decimal(r_digits: 2) }
    amount_due { Faker::Number.decimal(r_digits: 2) }
    company
    client
  end
end
