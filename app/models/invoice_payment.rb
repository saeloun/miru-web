# frozen_string_literal: true

# == Schema Information
#
# Table name: invoice_payments
#
#  id               :bigint           not null, primary key
#  amount           :decimal(20, 2)   default(0.0)
#  note             :text
#  status           :integer          not null
#  transaction_date :date             not null
#  transaction_type :integer          not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  invoice_id       :bigint           not null
#
# Indexes
#
#  index_invoice_payments_on_invoice_id  (invoice_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#
class InvoicePayment < ApplicationRecord
  enum status: [
    :paid,
    :failed
  ]

  enum transaction_type: [
    :visa,
    :mastercard,
    :bank_transfer,
    :ach,
    :amex,
    :cash,
    :cheque,
    :credit_card,
    :debit_card,
    :paypal,
    :stripe
  ]

  belongs_to :invoice

  validates :invoice, :transaction_date, :transaction_type, :amount, :status, presence: true
  validates :amount, numericality: { greater_than: 0 }
end
