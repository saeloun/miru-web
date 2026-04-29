# frozen_string_literal: true

class Webhooks::RazorpayController < ApplicationController
  RAZORPAY_SIGNATURE_HEADER = "HTTP_X_RAZORPAY_SIGNATURE"

  # Razorpay calls this endpoint server-to-server without a Miru user session.
  # The trust boundary is the X-Razorpay-Signature check in the fulfillment service.
  skip_around_action :switch_locale
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def payment_links
    fulfillment = InvoicePayment::RazorpayPaymentLinkWebhookFulfillment.new(
      payload: request.body.read,
      signature: request.get_header(RAZORPAY_SIGNATURE_HEADER)
    )

    if fulfillment.process
      render json: { status: "ok" }, status: 200
    else
      render json: { error: fulfillment.error || "Unable to process Razorpay webhook" }, status: failure_status(fulfillment)
    end
  rescue StandardError => exception
    log_processing_error(exception)
    render json: { error: "Unable to process Razorpay webhook" }, status: 500
  end

  private

    def failure_status(fulfillment)
      return 401 if fulfillment.error_code == :invalid_signature

      422
    end

    def log_processing_error(exception)
      Sentry.capture_exception(
        exception,
        extra: { request_id: request.request_id, webhook: "razorpay_payment_links" }
      ) if defined?(Sentry)

      Rails.logger.error(
        "[Razorpay webhook] payment_links failed request_id=#{request.request_id} " \
        "error_class=#{exception.class.name} error_message=#{exception.message}"
      )
    end
end
