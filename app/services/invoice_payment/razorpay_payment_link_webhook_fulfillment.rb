# frozen_string_literal: true

class InvoicePayment::RazorpayPaymentLinkWebhookFulfillment
  PAYMENT_EVENTS = ["payment_link.paid", "payment_link.partially_paid"].freeze
  INACTIVE_LINK_EVENTS = ["payment_link.cancelled", "payment_link.expired"].freeze
  SUPPORTED_EVENTS = (PAYMENT_EVENTS + INACTIVE_LINK_EVENTS).freeze

  attr_reader :payload, :signature, :error, :error_code

  def initialize(payload:, signature:)
    @payload = payload.to_s
    @signature = signature.to_s
  end

  def process
    return unsupported_event_success unless SUPPORTED_EVENTS.include?(event)
    return fail_with("Invoice not found") if invoice.blank?
    return fail_with("Razorpay webhook secret is not configured") if provider&.webhook_secret.blank?
    return fail_with("Invalid Razorpay webhook signature", :invalid_signature) unless valid_signature?
    return expire_payment_link if INACTIVE_LINK_EVENTS.include?(event)
    return true if invoice.paid?
    return true if duplicate_payment?

    payment = InvoicePayment::Settle.process(payment_params, invoice)
    invoice.update!(
      razorpay_payment_id: payment_id.presence || invoice.razorpay_payment_id,
      razorpay_payment_link_status: payment_link_status
    )
    enqueue_auto_payout(payment)
    send_payment_emails if invoice.paid? && payment.present?

    true
  rescue JSON::ParserError
    fail_with("Invalid Razorpay webhook payload")
  rescue ActiveRecord::RecordInvalid => exception
    fail_with(exception.record.errors.full_messages.to_sentence)
  end

  private

    def parsed_payload
      @_parsed_payload ||= JSON.parse(payload)
    end

    def event
      parsed_payload["event"].to_s
    end

    def unsupported_event_success
      true
    end

    def invoice
      @_invoice ||= begin
        invoice_id = payment_link_notes["miru_invoice_id"].presence || reference_invoice_id
        Invoice.kept.find_by(id: invoice_id)
      end
    end

    def reference_invoice_id
      payment_link["reference_id"].to_s.delete_prefix("miru-inv-")
    end

    def provider
      @_provider ||= invoice&.company&.payments_providers&.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      )
    end

    def valid_signature?
      return false if signature.blank?

      client.verify_webhook_signature(payload:, signature:, webhook_secret: provider.webhook_secret)
    end

    def payment_params
      {
        invoice_id: invoice.id,
        transaction_date: Time.zone.at(payment_link.fetch("updated_at", parsed_payload.fetch("created_at", Time.current.to_i))).to_date,
        transaction_type: "razorpay",
        amount: amount_from_subunits(amount_paid),
        note: "Razorpay_Payment_Link_Webhook",
        name: payment_link.dig("customer", "name")
      }
    end

    def payment_link
      @_payment_link ||= parsed_payload.dig("payload", "payment_link", "entity") || {}
    end

    def payment_link_notes
      @_payment_link_notes ||= payment_link["notes"].is_a?(Hash) ? payment_link["notes"] : {}
    end

    def payment
      @_payment ||= parsed_payload.dig("payload", "payment", "entity") || {}
    end

    def amount_paid
      payment["amount"].presence || payment_link["amount_paid"].presence || 0
    end

    def payment_id
      payment["id"].to_s
    end

    def duplicate_payment?
      payment_id.present? && invoice.razorpay_payment_id == payment_id
    end

    def expire_payment_link
      return true if payment_link_id.present? && invoice.razorpay_payment_link_id != payment_link_id

      invoice.update!(
        razorpay_payment_link_id: nil,
        razorpay_payment_link_url: nil,
        razorpay_payment_link_status: payment_link_status
      )
      true
    end

    def payment_link_id
      payment_link["id"].to_s
    end

    def payment_link_status
      payment_link["status"].presence || event.delete_prefix("payment_link.")
    end

    def amount_from_subunits(amount)
      Money.from_cents(amount.to_i, invoice.currency).amount
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
      return if payment.blank?

      RazorpayPayoutJob.perform_later(payment.id)
    end

    def fail_with(message, code = nil)
      @error = message
      @error_code = code
      false
    end

    def client
      @_client ||= PaymentProviders::RazorpayClient.new(provider:)
    end
end
