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
    return acknowledge_failure("Invalid PayPal webhook payload") if malformed?
    return true unless SUPPORTED_EVENTS.include?(event_type)
    return acknowledge("Invoice not found") if invoice.blank?
    return acknowledge("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return acknowledge("PayPal webhook is not registered for this workspace") if provider.webhook_id.blank?

    case signature_status
    when :invalid then return fail_with("Invalid PayPal webhook signature", :invalid_signature)
    when :unavailable then return fail_with("Unable to verify the PayPal webhook signature", :verification_unavailable)
    end

    return acknowledge("PayPal order id is missing") if order_id.blank?

    fulfillment = InvoicePayment::PaypalCaptureFulfillment.new(invoice:, order_id:)
    return true if fulfillment.process

    if fulfillment.error_code == :provider_unavailable
      fail_with(fulfillment.error, :provider_unavailable)
    else
      acknowledge_failure(fulfillment.error || "Unable to settle PayPal payment")
    end
  rescue TypeError
    acknowledge_failure("Invalid PayPal webhook payload")
  end

  private

    def parsed_payload
      return @_parsed_payload if defined?(@_parsed_payload)

      parsed = begin
        JSON.parse(payload)
      rescue JSON::ParserError
        @_malformed = true
        nil
      end

      @_parsed_payload = parsed.is_a?(Hash) ? parsed : {}
    end

    def malformed?
      parsed_payload
      @_malformed == true
    end

    def event_type
      parsed_payload["event_type"].to_s
    end

    def resource
      parsed_payload["resource"].is_a?(Hash) ? parsed_payload["resource"] : {}
    end

    def purchase_unit
      unit = Array(resource["purchase_units"]).first
      unit.is_a?(Hash) ? unit : {}
    end

    def order_id
      if event_type == ORDER_APPROVED_EVENT
        resource["id"].to_s
      else
        supplementary = resource["supplementary_data"]
        return "" unless supplementary.is_a?(Hash)

        related = supplementary["related_ids"]
        related.is_a?(Hash) ? related["order_id"].to_s : ""
      end
    end

    def custom_id
      event_type == ORDER_APPROVED_EVENT ? purchase_unit["custom_id"].to_s : resource["custom_id"].to_s
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

    def signature_status
      verified = PaymentProviders::PaypalClient.new(provider:).verify_webhook_signature(
        headers:,
        body: payload,
        webhook_id: provider.webhook_id
      )
      verified ? :valid : :invalid
    rescue PaymentProviders::PaypalClient::Error => exception
      Rails.logger.warn("[PayPal webhook] signature verification unavailable error=#{exception.message} #{event_context}")
      :unavailable
    end

    def acknowledge(message)
      Rails.logger.info("[PayPal webhook] acknowledged without settlement reason=#{message} #{event_context}")
      true
    end

    def acknowledge_failure(message)
      Rails.logger.error("[PayPal webhook] settlement failed permanently reason=#{message} #{event_context}")
      Sentry.capture_message(
        "PayPal webhook could not be settled",
        level: :error,
        extra: { reason: message, event_id: parsed_payload["id"], event_type:, order_id:, invoice_id: invoice&.id }
      ) if defined?(Sentry)
      true
    end

    def event_context
      "event_id=#{parsed_payload['id']} event_type=#{event_type} order_id=#{order_id} " \
        "custom_id=#{custom_id} invoice_id=#{invoice&.id} company_id=#{invoice&.company_id}"
    end

    def fail_with(message, code = nil)
      @error = message
      @error_code = code
      false
    end
end
