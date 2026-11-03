# frozen_string_literal: true

class InvoicePayment::RazorpayPaymentLinkFulfillment < ApplicationService
  attr_reader :invoice, :params, :provider

  def initialize(invoice:, params:)
    @invoice = invoice
    @params = params
    @provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER, enabled: true)
  end

  def process
    return false unless valid_payment?
    payment_link = client.fetch_payment_link(payment_link_id)
    return false unless payment_link["status"] == "paid"

    payment = nil
    invoice.with_lock do
      return true if invoice.paid?
      return false unless oauth_payment_verified?(payment_link)

      payment = InvoicePayment::Settle.process(payment_params(payment_link), invoice)
      invoice.update!(razorpay_payment_id:)
    end

    enqueue_auto_payout(payment)
    send_payment_emails if invoice.paid? && payment.present?

    true
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Razorpay fulfillment failed for invoice #{invoice.id}: #{error.message}")
    false
  end

  private

    # Razorpay documents the Payment Link callback signature only with an API key secret, which
    # OAuth merchants never share. OAuth callbacks are untrusted hints until the authenticated fetch.
    def valid_payment?
      return false unless provider.present? && invoice.razorpay_payment_link_id == payment_link_id && payment_status == "paid"
      return provider.razorpay_oauth_collections_ready? && razorpay_payment_id.present? if provider.razorpay_oauth?

      provider.razorpay_configured? && client.verify_payment_link_signature(payment_link_signature_attributes)
    end

    def flag_for_review(payment_link)
      verification = PaymentProviders::RazorpayPaymentLinkVerification.new(invoice:, payment_link:, account_id: provider.settings["oauth_account_id"])
      return unless verification.bound_to_invoice? && verification.captured_payment_id.present?

      PaymentProviders::RazorpayPaymentReview.flag!(invoice, payment_id: verification.captured_payment_id, payment_link_id:,
        amount: payment_link["amount_paid"], reason: "callback_mismatch")
    end

    def oauth_payment_verified?(payment_link)
      return true unless provider.razorpay_oauth?

      verified = PaymentProviders::RazorpayPaymentLinkVerification.new(
        invoice:, payment_link:, account_id: provider.settings["oauth_account_id"]
      ).captured?(razorpay_payment_id)
      flag_for_review(payment_link) unless verified
      verified
    end

    def payment_link_signature_attributes
      {
        payment_link_id:,
        payment_link_reference_id:,
        payment_link_status: payment_status,
        razorpay_payment_id:,
        razorpay_signature:
      }
    end

    def payment_params(payment_link)
      {
        invoice_id: invoice.id,
        transaction_date: Time.zone.at(payment_link.fetch("updated_at", Time.current.to_i)).to_date,
        transaction_type: "razorpay",
        amount: amount_from_subunits(payment_link.fetch("amount_paid")),
        payment_currency: invoice.currency,
        provider_event_id: "razorpay:#{razorpay_payment_id}",
        note: "Razorpay_Payment_Link_Success",
        name: payment_link.dig("customer", "name")
      }
    end

    def send_payment_emails
      PaymentMailer.with(
        invoice_id: invoice.id,
        subject: "Payment details by #{invoice.client.name}"
      ).payment.deliver_later

      invoice.send_to_client_email(
        invoice_id: invoice.id,
        subject: "Payment Confirmation of Invoice #{invoice.invoice_number} by #{invoice.client.name}"
      )
    end

    def enqueue_auto_payout(payment)
      return if payment.blank? || provider.razorpay_oauth?

      RazorpayPayoutJob.perform_later(payment.id)
    end

    def amount_from_subunits(amount)
      Money.from_cents(amount, invoice.currency).amount
    end

    def payment_link_id
      params[:razorpay_payment_link_id].to_s
    end

    def payment_link_reference_id
      params[:razorpay_payment_link_reference_id].to_s
    end

    def payment_status
      params[:razorpay_payment_link_status].to_s
    end

    def razorpay_payment_id
      params[:razorpay_payment_id].to_s
    end

    def razorpay_signature
      params[:razorpay_signature].to_s
    end

    def client
      @_client ||= PaymentProviders::RazorpayClient.new(provider:)
    end
end
