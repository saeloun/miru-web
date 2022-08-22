# frozen_string_literal: true

FactoryBot.define do
  factory :payment do
    amount { Faker::Number.decimal(r_digits: 2) }
    note { "This is payment note" }
    status { [:failed, :paid, :partially_paid].sample }
    transaction_date { Faker::Date.between(from: "2019-04-01", to: Date.today) }
    transaction_type { [:visa, :credit_card, :debit_card].sample }
    invoice
  end
end
