# frozen_string_literal: true

class HandleStripeCheckoutEventService
  attr_reader :payload, :stripe_signature, :stripe_webhook_secret,
    :event, :status, :json

  STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT = "checkout.session.completed"
  STRIPE_CHECKOUT_SESSION_EXPIRED_EVENT = "checkout.session.expired"
  STRIPE_PAYMENT_INTENT_FAILED_EVENT = "payment_intent.payment_failed"
  STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT = "customer.subscription.created"
  STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT = "customer.subscription.updated"
  STRIPE_CUSTOMER_SUBSCRIPTION_DELETED_EVENT = "customer.subscription.deleted"
  STRIPE_INVOICE_PAID_EVENT = "invoice.paid"

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
        handle_checkout_session_completed
      when STRIPE_CHECKOUT_SESSION_EXPIRED_EVENT
        if InvoicePayment::StripeCheckoutFailed.process(event)
          set_response({ success: true }, :ok)
        else
          set_response({ message: "Invalid payload!" }, 400)
        end
      when STRIPE_PAYMENT_INTENT_FAILED_EVENT
        if InvoicePayment::StripePaymentFailed.process(event)
          set_response({ success: true }, :ok)
        else
          set_response({ message: "Invalid payload!" }, 400)
        end
      when STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_EVENT,
        STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT,
        STRIPE_CUSTOMER_SUBSCRIPTION_DELETED_EVENT
        handle_subscription_event
      when STRIPE_INVOICE_PAID_EVENT
        handle_paid_invoice_event
      else
        # NOOP
      end
    end

    def handle_checkout_session_completed
      checkout_session = event.data.object

      if checkout_session.mode == "subscription"
        company_id = checkout_session.metadata&.company_id
        company = Company.find_by(id: company_id)

        success =
          Subscriptions::StripeSyncService.process(
            company:,
            stripe_customer_id: checkout_session.customer,
            stripe_subscription_id: checkout_session.subscription,
            notify_plan_purchase: true
          )

        if success
          set_response({ success: true }, :ok)
        else
          set_response({ message: "Invalid payload!" }, 400)
        end
      elsif InvoicePayment::StripeCheckoutFulfillment.process(event)
        set_response({ success: true }, :ok)
      else
        set_response({ message: "Invalid payload!" }, 400)
      end
    end

    def handle_subscription_event
      subscription = event.data.object
      success =
        Subscriptions::StripeSyncService.process(
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          subscription:
        )

      set_response(success ? { success: true } : { message: "Invalid payload!" }, success ? :ok : 400)
    end

    def handle_paid_invoice_event
      invoice = event.data.object
      subscription_id = invoice.subscription
      return if subscription_id.blank?

      success =
        Subscriptions::StripeSyncService.process(
          stripe_customer_id: invoice.customer,
          stripe_subscription_id: subscription_id
        )

      set_response(success ? { success: true } : { message: "Invalid payload!" }, success ? :ok : 400)
    end

    def set_response(json, status)
      @json = json
      @status = status
    end
end
