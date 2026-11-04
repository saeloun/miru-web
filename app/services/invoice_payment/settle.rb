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
      if payment.stripe?
        ActiveRecord.after_all_transactions_commit { send_stripe_payment_confirmation }
      end

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
      rescue StandardError => error
        Rails.logger.error("stripe_payment_confirmation_failed invoice_id=#{invoice.id} error_class=#{error.class}")
        Sentry.capture_exception(error)
      end
  end
end
