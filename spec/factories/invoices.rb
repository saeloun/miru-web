# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    issue_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    due_date { Faker::Date.between(from: self.issue_date, to: Date.today) }
    invoice_number { Faker::Alphanumeric.unique.alpha(number: 4) }
    reference { Faker::Invoice.reference }
    amount { Faker::Number.decimal(r_digits: 2) }
    outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    tax { Faker::Number.decimal(r_digits: 2) }
    amount_paid { Faker::Number.decimal(r_digits: 2) }
    amount_due { Faker::Number.decimal(r_digits: 2) }
    discount { Faker::Number.decimal(r_digits: 2) }
    client
    status { [:draft, :paid].sample }
    factory :invoice_with_invoice_line_items do
      invoice_line_items { Array.new(5) { association(:invoice_line_item) } }
    end
  end
end
