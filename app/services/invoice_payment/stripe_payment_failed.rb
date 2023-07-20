# frozen_string_literal: true

class InvoicePayment::StripePaymentFailed < ApplicationService
  attr_reader :event, :data_object
  attr_accessor :invoice

  def initialize(event)
    @event = event
    @data_object = event.data.object
    @invoice = nil
  end

  def process
    @invoice = Invoice.where("payment_infos ->> 'stripe_payment_intent' = ?", data_object.id).first
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
        status: :failed,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: Money.from_cents(event.data.object.amount, event.data.object.currency).amount,
        note: "Stripe_Payment_Failed",
        name: card_name
      }
    end

    def card_name
      payment_method = data_object.last_payment_error&.payment_method

      payment_method&.billing_details&.name
    end
end
