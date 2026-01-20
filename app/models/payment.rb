# frozen_string_literal: true

# == Schema Information
#
# Table name: payments
#
#  id               :bigint           not null, primary key
#  amount           :decimal(20, 2)   default(0.0)
#  name             :string
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
#  index_payments_on_invoice_id  (invoice_id)
#  index_payments_on_status      (status)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#
class Payment < ApplicationRecord
  enum :status, { paid: 0, partially_paid: 1, failed: 2, cancelled: 3 }

  enum :transaction_type, {
    visa: 0, mastercard: 1, bank_transfer: 2, ach: 3, amex: 4,
    cash: 5, cheque: 6, credit_card: 7, debit_card: 8, paypal: 9, stripe: 10
  }

  belongs_to :invoice
  delegate :company, to: :invoice

  before_validation :set_status, if: :new_record?

  validates :invoice, :transaction_date, :transaction_type, :amount, :status, presence: true
  validates :amount, numericality: { greater_than: 0 }

  def settles?(invoice)
    invoice.amount_due <= amount
  end

  private

    def set_status
      return if status.present?

      if settles?(invoice)
        self.status = :paid
      else
        self.status = :partially_paid
      end
    end
end
