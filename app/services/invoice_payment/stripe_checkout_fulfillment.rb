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
    if is_valid_event
      InvoicePayment::AddPayment.process(payment_params, invoice)
    end
  end

  private

    def is_valid_event
      invoice.stripe_payment_intent == data_object.payment_intent &&
      data_object.status == "complete" &&
      data_object.payment_status == "paid"
    end

    def payment_params
      {
        invoice_id: invoice.id,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: event.data.object.amount_total,
        note: "Stripe_Payment_success"
      }
    end
end
