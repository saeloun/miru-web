# frozen_string_literal: true

module InvoicePayment
  class InvoicePayment::Settle < ApplicationService
    attr_reader :payment_params
    attr_accessor :payment, :invoice

    def initialize(payment_params, invoice)
      @invoice = invoice
      @payment_params = payment_params
    end

    def process
      ActiveRecord::Base.transaction do
        @payment = Payment.create!(payment_params)
        @invoice.settle!(payment)
      end
      send_stripe_payment_confirmation if payment.stripe?

      @payment
    end

    private

      def send_stripe_payment_confirmation
        PaymentMailer.with(
          invoice_id: invoice.id,
          subject: "Payment details by #{invoice.client.name}"
        ).payment.deliver_later

        invoice.send_to_client_email(
          invoice_id: invoice.id,
          subject: "Payment Confirmation of Invoice #{invoice.invoice_number} by #{invoice.client.name}"
        )
      end
  end
end
