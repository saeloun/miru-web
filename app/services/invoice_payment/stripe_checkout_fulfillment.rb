# frozen_string_literal: true

class InvoicePayment::StripeCheckoutFulfillment < ApplicationService
  attr_reader :event, :data_object
  attr_accessor :invoice

  def initialize(event)
    @event = event
    @data_object = event.data.object
    @invoice = nil
  end

  def process
    @invoice = Invoice.find(event.data.object.metadata.invoice_id)
    if is_valid_event?
      InvoicePayment::Settle.process(payment_params, invoice)
    end
    rescue StandardError => error
      Rails.logger.error error.message
      Rails.logger.error error.backtrace.join("\n")
      nil
  end

  private

    def is_valid_event?
      invoice.stripe_payment_intent == data_object.payment_intent &&
      is_checkout_status_complete? &&
      is_payment_status_paid?
    end

    def is_checkout_status_complete?
      data_object.status == "complete"
    end

    def is_payment_status_paid?
      data_object.payment_status == "paid"
    end

    def payment_params
      {
        invoice_id: invoice.id,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: Money.from_cents(event.data.object.amount_total, event.data.object.currency).amount,
        note: "Stripe_Payment_Success"
      }
    end
end
