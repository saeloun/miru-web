# frozen_string_literal: true

class Webhooks::RazorpayController < ApplicationController
  RAZORPAY_SIGNATURE_HEADER = "HTTP_X_RAZORPAY_SIGNATURE"
  PAYMENT_LINKS_WEBHOOK = "razorpay_payment_links"
  PAYOUTS_WEBHOOK = "razorpay_payouts"

  # Razorpay calls this endpoint server-to-server without a Miru user session.
  # The trust boundary is the X-Razorpay-Signature check in the fulfillment service.
  skip_around_action :switch_locale
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def payment_links
    payload = request.body.read
    fulfillment = InvoicePayment::RazorpayPaymentLinkWebhookFulfillment.new(
      payload:,
      signature: request.get_header(RAZORPAY_SIGNATURE_HEADER)
    )

    render_fulfillment_result(fulfillment)
  rescue StandardError => exception
    log_processing_error(exception, PAYMENT_LINKS_WEBHOOK)
    render json: { error: "Unable to process Razorpay webhook" }, status: 500
  end

  def payouts
    payload = request.body.read
    fulfillment = PaymentProviders::RazorpayPayoutWebhookFulfillment.new(
      payload:,
      signature: request.get_header(RAZORPAY_SIGNATURE_HEADER)
    )

    render_fulfillment_result(fulfillment)
  rescue StandardError => exception
    log_processing_error(exception, PAYOUTS_WEBHOOK)
    render json: { error: "Unable to process Razorpay webhook" }, status: 500
  end

  private

    # Fulfillment services return true when the event is handled or can be safely
    # ignored. On failure they expose a user-safe error plus an optional error_code.
    def render_fulfillment_result(fulfillment)
      if fulfillment.process
        render json: { status: "ok" }, status: 200
      else
        render json: { error: fulfillment.error || "Unable to process Razorpay webhook" }, status: failure_status(fulfillment)
      end
    end

    def failure_status(fulfillment)
      return 401 if fulfillment.error_code == :invalid_signature

      422
    end

    def log_processing_error(exception, webhook)
      # Do not attach raw webhook payloads here; Razorpay payloads can contain
      # payer identifiers. request_id + webhook name is enough to find app logs.
      Sentry.capture_exception(
        exception,
        extra: { request_id: request.request_id, webhook: }
      ) if defined?(Sentry)

      Rails.logger.error(
        "[Razorpay webhook] #{webhook} failed request_id=#{request.request_id} " \
        "error_class=#{exception.class.name} error_message=#{exception.message}"
      )
    end
end
