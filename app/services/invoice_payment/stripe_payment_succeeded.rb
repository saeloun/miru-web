# frozen_string_literal: true

class InvoicePayment::StripePaymentSucceeded < ApplicationService
  attr_reader :event, :data_object
  attr_accessor :invoice

  def initialize(event)
    @event = event
    @data_object = event.data.object
    @invoice = nil
  end

  def process
    @invoice = Invoice.where("payment_infos ->> 'stripe_payment_intent' = ?", data_object.id).first
    return false if invoice.blank?

    invoice.with_lock do
      return true if invoice.paid? || Payment.exists?(provider_event_id: event.id)

      InvoicePayment::Settle.process(payment_params, invoice)
    end
  rescue StandardError => error
    Rails.logger.error error.message
    Rails.logger.error error.backtrace.join("\n")
    nil
  end

  private

    def payment_params
      {
        invoice_id: invoice.id,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: Money.from_cents(amount_total_cents, data_object.currency).amount,
        payment_currency: data_object.currency.upcase,
        note: "Stripe_Payment_Success",
        provider_event_id: event.id
      }
    end

    def amount_total_cents
      data_object.amount_received.presence || data_object.amount
    end
end
