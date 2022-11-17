# frozen_string_literal: true

class Webhooks::StripeController < ApplicationController
  include StripeCheckout

  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized
  protect_from_forgery except: :fulfill_stripe_checkout

  def fulfill_stripe_checkout
    handle_stripe_checkout_event(request)
  end
end
