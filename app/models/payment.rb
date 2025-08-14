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
#  index_payments_on_invoice_id  (invoice_id)
#  index_payments_on_status      (status)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#
class Payment < ApplicationRecord
  # Audit all payment and currency conversion details
  audited only: [:amount, :base_currency_amount, :exchange_rate, :exchange_rate_date, :payment_currency, :transaction_date, :status]

  enum :status, [
    :paid,
    :partially_paid,
    :failed,
    :cancelled
  ]

  enum :transaction_type, [
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
  delegate :company, to: :invoice

  before_validation :set_status, if: :new_record?
  before_validation :calculate_base_currency_amount

  validates :invoice, :transaction_date, :transaction_type, :amount, :status, presence: true
  validates :amount, numericality: { greater_than: 0 }

  def settles?(invoice)
    invoice.amount_due <= amount
  end

  def same_currency?
    payment_currency == company&.base_currency
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

    def calculate_base_currency_amount
      # Set payment currency if not set
      self.payment_currency ||= invoice&.currency

      # If same currency, base_currency_amount equals amount
      if same_currency?
        self.base_currency_amount = amount
        self.exchange_rate = 1.0
        return
      end

      # Get the exchange rate for the payment date
      payment_date = transaction_date || Date.current
      rate = CurrencyConversionService.get_exchange_rate(
        payment_currency,
        company&.base_currency,
        payment_date
      )

      if rate
        self.exchange_rate = rate
        self.exchange_rate_date = payment_date
        self.base_currency_amount = (amount * rate).round(2)
      else
        # If we can't get a rate, use invoice's exchange rate as fallback
        if invoice&.exchange_rate.present?
          self.exchange_rate = invoice.exchange_rate
          self.exchange_rate_date = payment_date
          self.base_currency_amount = (amount * invoice.exchange_rate).round(2)
        else
          # Last resort: assume 1:1 conversion
          self.exchange_rate = 1.0
          self.exchange_rate_date = payment_date
          self.base_currency_amount = amount
        end
      end
    end
end
