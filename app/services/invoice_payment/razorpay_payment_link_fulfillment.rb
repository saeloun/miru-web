# frozen_string_literal: true

require "openssl"

class InvoicePayment::RazorpayPaymentLinkFulfillment < ApplicationService
  attr_reader :invoice, :params, :provider

  def initialize(invoice:, params:)
    @invoice = invoice
    @params = params
    @provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER, enabled: true)
  end

  def process
    return false unless valid_payment?
    return true if invoice.paid?

    payment_link = client.fetch_payment_link(payment_link_id)
    return false unless payment_link["status"] == "paid"

    payment = InvoicePayment::Settle.process(payment_params(payment_link), invoice)
    invoice.update!(razorpay_payment_id: razorpay_payment_id)
    send_payment_emails if invoice.paid? && payment.present?

    true
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn("Razorpay fulfillment failed for invoice #{invoice.id}: #{error.message}")
    false
  end

  private

    def valid_payment?
      provider&.razorpay_configured? &&
        invoice.razorpay_payment_link_id == payment_link_id &&
        payment_status == "paid" &&
        secure_compare(expected_signature, razorpay_signature)
    end

    def expected_signature
      payload = [
        payment_link_id,
        payment_link_reference_id,
        payment_status,
        razorpay_payment_id
      ].join("|")

      OpenSSL::HMAC.hexdigest("SHA256", provider.key_secret, payload)
    end

    def payment_params(payment_link)
      {
        invoice_id: invoice.id,
        transaction_date: Time.zone.at(payment_link.fetch("updated_at", Time.current.to_i)).to_date,
        transaction_type: "razorpay",
        amount: amount_from_subunits(payment_link.fetch("amount_paid")),
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

    def amount_from_subunits(amount)
      Money.from_cents(amount, invoice.currency).amount
    end

    def secure_compare(expected, actual)
      return false if expected.blank? || actual.blank?

      ActiveSupport::SecurityUtils.secure_compare(expected, actual)
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
