# frozen_string_literal: true

class InvoicePayment::PaypalWebhookFulfillment
  CAPTURE_COMPLETED_EVENT = "PAYMENT.CAPTURE.COMPLETED"
  ORDER_APPROVED_EVENT = "CHECKOUT.ORDER.APPROVED"
  SUPPORTED_EVENTS = [CAPTURE_COMPLETED_EVENT, ORDER_APPROVED_EVENT].freeze

  attr_reader :payload, :headers, :error, :error_code

  def initialize(payload:, headers:)
    @payload = payload.to_s
    @headers = headers || {}
  end

  def process
    return true unless SUPPORTED_EVENTS.include?(event_type)
    return fail_with("Invoice not found") if invoice.blank?
    return fail_with("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return fail_with("PayPal webhook is not registered for this workspace") if provider.webhook_id.blank?
    return fail_with("Invalid PayPal webhook signature", :invalid_signature) unless valid_signature?
    return fail_with("PayPal order id is missing") if order_id.blank?

    fulfillment = InvoicePayment::PaypalCaptureFulfillment.new(invoice:, order_id:)
    return true if fulfillment.process

    fail_with(fulfillment.error || "Unable to settle PayPal payment")
  rescue JSON::ParserError
    fail_with("Invalid PayPal webhook payload")
  end

  private

    def parsed_payload
      @_parsed_payload ||= JSON.parse(payload)
    end

    def event_type
      parsed_payload["event_type"].to_s
    end

    def resource
      parsed_payload["resource"].is_a?(Hash) ? parsed_payload["resource"] : {}
    end

    def order_id
      if event_type == ORDER_APPROVED_EVENT
        resource["id"].to_s
      else
        resource.dig("supplementary_data", "related_ids", "order_id").to_s
      end
    end

    def custom_id
      if event_type == ORDER_APPROVED_EVENT
        Array(resource["purchase_units"]).first&.dig("custom_id").to_s
      else
        resource["custom_id"].to_s
      end
    end

    def invoice
      @_invoice ||= begin
        record = Invoice.kept.find_by(id: custom_id) if custom_id.match?(/\A\d+\z/)
        record || invoice_from_order_id
      end
    end

    def invoice_from_order_id
      return if order_id.blank?

      Invoice.kept.find_by("payment_infos ->> 'paypal_order_id' = ?", order_id)
    end

    def provider
      @_provider ||= invoice&.company&.payments_providers&.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def valid_signature?
      PaymentProviders::PaypalClient.new(provider:).verify_webhook_signature(headers:, body: payload, webhook_id: provider.webhook_id)
    rescue PaymentProviders::PaypalClient::Error
      false
    end

    def fail_with(message, code = nil)
      @error = message
      @error_code = code
      false
    end
end
