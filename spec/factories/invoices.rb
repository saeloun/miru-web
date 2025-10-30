# frozen_string_literal: true

FactoryBot.define do
  factory :invoice do
    transient do
      amount_value { Faker::Number.decimal(r_digits: 2) }
    end

    company
    client
    issue_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    due_date { Faker::Date.between(from: self.issue_date, to: Date.today) }
    invoice_number { Faker::Alphanumeric.unique.alpha(number: 4) }
    reference { Faker::Invoice.reference[1..12] }
    amount { amount_value }
    # Invoice currency defaults to company's base_currency to ensure consistency
    # This prevents unintended currency conversions in most tests and ensures
    # base_currency_amount equals amount (no conversion needed)
    currency { company&.base_currency || "USD" }
    # outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    # tax { Faker::Number.decimal(r_digits: 2) }
    # amount_paid { Faker::Number.decimal(r_digits: 2) }
    # amount_due { Faker::Number.decimal(r_digits: 2) }
    # discount { Faker::Number.decimal(r_digits: 2) }
    status { :draft }
    # Set base_currency_amount equal to amount since currency matches company.base_currency
    # For currency conversion tests that need different currencies, explicitly set:
    # - currency to a different value
    # - base_currency_amount to nil (to trigger the callback)
    # or use after(:build) to let the model calculate the converted amount
    base_currency_amount { amount_value }
    external_view_key { "#{SecureRandom.hex}" }
    factory :invoice_with_invoice_line_items do
      transient do
        length { 5 }
      end
      invoice_line_items { Array.new(length) { association(:invoice_line_item) } }
    end
  end
end
