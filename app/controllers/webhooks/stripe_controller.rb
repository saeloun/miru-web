# frozen_string_literal: true

class Webhooks::StripeController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized
  protect_from_forgery except: :fulfill_stripe_checkout

  def fulfill_stripe_checkout
    stripe_event_service = HandleStripeCheckoutEventService.new(
      payload: request.body.read,
      stripe_signature: request.env["HTTP_STRIPE_SIGNATURE"])
    stripe_event_service.process

    if stripe_event_service.status
      render json: stripe_event_service.json, status: stripe_event_service.status
    else
      render json: {}, status: 200
    end
  end
end
