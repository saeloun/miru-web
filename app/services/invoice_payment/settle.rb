# frozen_string_literal: true

module InvoicePayment
  class InvoicePayment::Settle < ApplicationService
    attr_reader :payment_params
    attr_accessor :payment, :invoice

    def initialize(payment_params, invoice, reconcile: false)
      @invoice = invoice
      @payment_params = reconcile ? payment_params.merge(status: :partially_paid) : payment_params
      @reconcile = reconcile
    end

    def process
      if @reconcile && invoice.payments.stripe.where(
        "provider_event_id IS NULL OR provider_event_id NOT LIKE ?", "stripe:%").exists?
        # shortcut: legacy Stripe rows cannot identify replays; reconcile their provider references before recording more.
        Sentry.capture_message("Stripe capture requires legacy payment reconciliation", level: :warning,
          extra: { invoice_id: invoice.id, provider_event_id: payment_params[:provider_event_id] })
        return true
      end

      ActiveRecord::Base.transaction do
        @payment = Payment.create!(payment_params)
        @invoice.settle!(payment) unless @reconcile
      end
      if payment.stripe? && !@reconcile
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
