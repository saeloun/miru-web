# frozen_string_literal: true

class Webhooks::StripeController < ApplicationController
  MAX_WEBHOOK_BODY_BYTES = 1.megabyte

  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized
  protect_from_forgery except: :fulfill_stripe_checkout

  def fulfill_stripe_checkout
    request.body.rewind
    payload = request.body.read(MAX_WEBHOOK_BODY_BYTES + 1).to_s
    if payload.bytesize > MAX_WEBHOOK_BODY_BYTES
      return render json: { error: "Stripe webhook payload is too large" }, status: 413
    end

    stripe_event_service = HandleStripeCheckoutEventService.new(
      payload:,
      stripe_signature: request.env["HTTP_STRIPE_SIGNATURE"])
    stripe_event_service.process

    if stripe_event_service.status
      render json: stripe_event_service.json, status: stripe_event_service.status
    else
      render json: {}, status: 200
    end
  end
end
