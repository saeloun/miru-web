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
    # Invoice currency defaults to client's currency to ensure consistency
    # This prevents unintended currency conversions in most tests
    currency { client&.currency || "USD" }
    # outstanding_amount { Faker::Number.decimal(r_digits: 2) }
    # tax { Faker::Number.decimal(r_digits: 2) }
    # amount_paid { Faker::Number.decimal(r_digits: 2) }
    # amount_due { Faker::Number.decimal(r_digits: 2) }
    # discount { Faker::Number.decimal(r_digits: 2) }
    status { :draft }
    # Set base_currency_amount to prevent callback from running in most tests
    # Since invoice.currency defaults to client.currency (USD) and company.base_currency is USD in tests,
    # base_currency_amount should equal amount. For currency conversion tests that explicitly set
    # different currencies, they should also explicitly set base_currency_amount to nil to trigger
    # the callback, or let the callback run after creation.
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
