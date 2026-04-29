# frozen_string_literal: true

class PaymentsPresenter
  attr_reader :payments, :current_company

  def self.serialize_razorpay_payout(payout)
    return unless payout

    {
      id: payout.id,
      externalId: payout.external_id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      triggeredBy: payout.triggered_by,
      failureReason: payout.failure_reason,
      recipientUpiId: payout.recipient_upi_id,
      processedAt: payout.processed_at&.iso8601,
      createdAt: payout.created_at.iso8601
    }
  end

  def initialize(payments, current_company)
    @payments = payments
    @current_company = current_company
  end

  def index_data
    {
      payments:
              payments.map do |payment|
                {
                  id: payment.id,
                  clientName: payment.invoice.client.name,
                  invoiceNumber: payment.invoice.invoice_number,
                  invoiceId: payment.invoice.id,
                  transactionDate: CompanyDateFormattingService.new(
                    payment.transaction_date,
                    company: current_company
                  ).process,
                  note: payment.note,
                  transactionType: payment.transaction_type,
                  amount: payment.amount,
                  status: payment.status,
                  currency: attribute_value(payment, :payment_currency) || payment.invoice.currency || current_company.base_currency,
                  exchangeRate: attribute_value(payment, :exchange_rate),
                  baseCurrencyAmount: attribute_value(payment, :base_currency_amount),
                  razorpayPayout: self.class.serialize_razorpay_payout(latest_razorpay_payout(payment))
                }
              end,
      total: payments.size,
      baseCurrency: current_company.base_currency
    }
  end

  private

    def attribute_value(record, attribute)
      return unless record.respond_to?(attribute)

      record.public_send(attribute)
    end

    def latest_razorpay_payout(payment)
      if payment.razorpay_payouts.loaded?
        payment.razorpay_payouts.max_by(&:created_at)
      else
        payment.razorpay_payouts.order(created_at: :desc).first
      end
    end
end
