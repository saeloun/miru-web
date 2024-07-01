# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    company
    client
    issue_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    due_date { Faker::Date.between(from: self.issue_date, to: Date.today) }
    invoice_number { Faker::Alphanumeric.unique.alpha(number: 4) }
    reference { Faker::Invoice.reference[1..12] }
    amount { Faker::Number.decimal(r_digits: 2) }
    # outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    # tax { Faker::Number.decimal(r_digits: 2) }
    # amount_paid { Faker::Number.decimal(r_digits: 2) }
    # amount_due { Faker::Number.decimal(r_digits: 2) }
    # discount { Faker::Number.decimal(r_digits: 2) }
    status { :draft }
    external_view_key { "#{SecureRandom.hex}" }
    factory :invoice_with_invoice_line_items do
      transient do
        length { 5 }
      end
      invoice_line_items { Array.new(length) { association(:invoice_line_item) } }
    end
  end
end
