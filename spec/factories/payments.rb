# frozen_string_literal: true

# == Schema Information
#
# Table name: payments
#
#  id                   :bigint           not null, primary key
#  amount               :decimal(20, 2)   default(0.0)
#  base_currency_amount :decimal(20, 2)
#  exchange_rate        :decimal(18, 10)
#  exchange_rate_date   :date
#  name                 :string
#  note                 :text
#  payment_currency     :string
#  status               :integer          not null
#  transaction_date     :date             not null
#  transaction_type     :integer          not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  invoice_id           :bigint           not null
#
# Indexes
#
#  index_payments_on_invoice_id                       (invoice_id)
#  index_payments_on_status                           (status)
#  index_payments_on_transaction_date_and_invoice_id  (transaction_date,invoice_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#
FactoryBot.define do
  factory :payment do
    amount { Faker::Number.decimal(r_digits: 2) }
    note { "This is payment note" }
    status { [:failed, :paid, :partially_paid].sample }
    transaction_date { Faker::Date.between(from: "2022-01-01", to: Date.today) }
    transaction_type { [:visa, :credit_card, :debit_card].sample }
    invoice
  end
end
