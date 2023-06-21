# frozen_string_literal: true

class InvoicePayment::StripeCheckoutFailed < ApplicationService
  attr_reader :event, :data_object
  attr_accessor :invoice

  def initialize(event)
    @event = event
    @data_object = event.data.object
    @invoice = nil
  end

  def process
    @invoice = Invoice.find(event.data.object.metadata.invoice_id)
    @payment = Payment.create!(payment_params)
    rescue StandardError => error
      Rails.logger.error error.message
      Rails.logger.error error.backtrace.join("\n")
      nil
  end

  private

    def payment_params
      {
        invoice_id: invoice.id,
        status: :cancelled,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: Money.from_cents(event.data.object.amount_total, event.data.object.currency).amount,
        note: "Stripe_Payment_Expired"
      }
    end
end
