# frozen_string_literal: true

class HandleStripeCheckoutEventService
  attr_reader :payload, :stripe_signature, :stripe_webhook_secret,
    :event, :status, :json

  STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT = "checkout.session.completed"

  def initialize(payload:, stripe_signature:)
    @payload = payload
    @stripe_signature = stripe_signature
    @stripe_webhook_secret = ENV["STRIPE_WEBHOOK_ENDPOINT_SECRET"]

    @event = nil
    @json = nil
    @status = nil
  end

  def process
    fetch_event
    handle_event
  end

  private

    def fetch_event
      @event = Stripe::Webhook.construct_event(
        payload, stripe_signature, stripe_webhook_secret
      )
    rescue JSON::ParserError
      set_response({ message: "Invalid payload!" }, 400)
    rescue Stripe::SignatureVerificationError
      set_response({ message: "Invalid signature!" }, 400)
    end

    def handle_event
      case event.type
      when STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT
        if InvoicePayment::StripeCheckoutFulfillment.process(event)
          set_response({ success: true }, :ok)
        else
          set_response({ message: "Invalid payload!" }, 400)
        end
      else
        # NOOP
      end
    end

    def set_response(json, status)
      @json = json
      @status = status
    end
end
