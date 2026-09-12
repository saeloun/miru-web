# frozen_string_literal: true

class Webhooks::PaypalController < ApplicationController
  MAX_WEBHOOK_BODY_BYTES = 1.megabyte

  skip_around_action :switch_locale
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def events
    payload = bounded_payload
    return if performed?

    fulfillment = InvoicePayment::PaypalWebhookFulfillment.new(payload:, headers: paypal_headers)

    if fulfillment.process
      render json: { status: "ok" }, status: 200
    else
      render json: { error: fulfillment.error || "Unable to process PayPal webhook" }, status: failure_status(fulfillment)
    end
  rescue StandardError => exception
    log_processing_error(exception)
    render json: { error: "Unable to process PayPal webhook" }, status: 500
  end

  private

    def bounded_payload
      payload = request.body.read(MAX_WEBHOOK_BODY_BYTES + 1).to_s
      return payload if payload.bytesize <= MAX_WEBHOOK_BODY_BYTES

      render json: { error: "PayPal webhook payload is too large" }, status: 413
      nil
    end

    def paypal_headers
      PaymentProviders::PaypalClient::SIGNATURE_HEADERS.values.index_with { |name| request.headers[name].to_s }
    end

    def failure_status(fulfillment)
      case fulfillment.error_code
      when :invalid_signature then 401
      when :verification_unavailable then 503
      else 422
      end
    end

    def log_processing_error(exception)
      Sentry.capture_exception(exception, extra: { request_id: request.request_id, webhook: "paypal_events" }) if defined?(Sentry)
      Rails.logger.error(
        "[PayPal webhook] failed request_id=#{request.request_id} error_class=#{exception.class.name} error_message=#{exception.message}"
      )
    end
end
