# frozen_string_literal: true

module PaymentProviders
  class RazorpayOauthWebhook
    REVOKED_EVENT = "account.app.authorization_revoked"
    MERCHANT_EVENTS = {
      "account.activated" => "activated", "account.instantly_activated" => "instantly_activated",
      "account.payments_enabled" => "payments_enabled", "account.funds_unhold" => "funds_unhold",
      "account.under_review" => "under_review", "account.needs_clarification" => "needs_clarification",
      "account.funds_hold" => "funds_hold", "account.suspended" => "suspended", "account.rejected" => "rejected"
    }.freeze

    attr_reader :error, :error_code

    def initialize(payload:, signature:, event_id:)
      @payload = payload.to_s
      @signature = signature.to_s
      @event_id = event_id.to_s.first(80)
    end

    def process
      return fail_with("Razorpay OAuth webhooks are not configured") if secret.blank?
      return fail_with("Invalid Razorpay webhook signature", :invalid_signature) unless valid_signature?

      route_event
    rescue JSON::ParserError, JSON::NestingError
      fail_with("Invalid Razorpay webhook payload")
    rescue RazorpayOauthClient::Error
      fail_with("Razorpay OAuth webhooks are not configured")
    end

    private

      def route_event
        event = parsed_payload["event"]
        return handle_payment_event if InvoicePayment::RazorpayPaymentLinkWebhookFulfillment::SUPPORTED_EVENTS.include?(event)
        return true unless event == REVOKED_EVENT || MERCHANT_EVENTS.key?(event)
        return fail_with("Invalid Razorpay webhook payload") unless account_id.match?(RazorpayOauthConnection::ACCOUNT_ID) && occurred_at
        return true if contradicted_activation?(event)

        matching_providers(event).each { |provider| apply_account_event(provider, event) }
        true
      end

      def apply_account_event(provider, event)
        connection = RazorpayOauthConnection.new(provider:, actor: nil)
        return connection.provider_revoked!(occurred_at:, event_id: @event_id) if event == REVOKED_EVENT

        connection.merchant_status_changed!(MERCHANT_EVENTS.fetch(event), occurred_at:, event_id: @event_id)
      end

      def handle_payment_event
        return fail_with("Invalid Razorpay webhook payload") unless account_id.match?(RazorpayOauthConnection::ACCOUNT_ID)

        fulfillment = InvoicePayment::RazorpayOauthPaymentLinkWebhookFulfillment.new(payload: @payload, signature: @signature, account_id:)
        fulfillment.process || fail_with(fulfillment.error || "Unable to process Razorpay webhook")
      end

      # The provider's activation payload carries these flags; a false value outranks the event name.
      def contradicted_activation?(event)
        return false unless RazorpayOauthConnection::ACTIVE_MERCHANT_STATUSES.include?(MERCHANT_EVENTS[event])

        parsed_payload.dig("payload", "account", "entity", "activated") == false
      end

      def matching_providers(event)
        identity = RazorpayOauthClient.new.identity
        providers = PaymentsProvider.where(name: PaymentsProvider::RAZORPAY_PROVIDER)
          .where("settings ->> 'authentication_mode' = 'oauth'")
          .where("settings ->> 'oauth_client_id' = ? AND settings ->> 'oauth_mode' = ?", identity.fetch("client_id"), identity.fetch("mode"))
        return providers.where("settings ->> 'oauth_account_id' = ?", account_id) unless event == REVOKED_EVENT

        providers.where("settings ->> 'oauth_account_id' = :account OR settings -> 'oauth_recovery' ->> 'account_id' = :account", account: account_id)
      end

      def parsed_payload
        @_parsed_payload ||= JSON.parse(@payload, max_nesting: 20).then { |parsed| parsed.is_a?(Hash) ? parsed : {} }
      end

      def account_id
        parsed_payload["account_id"].to_s
      end

      def occurred_at
        created_at = parsed_payload["created_at"]
        created_at if created_at.is_a?(Integer) && created_at.positive?
      end

      def valid_signature?
        return false if @signature.blank?

        Razorpay::Utility.verify_webhook_signature(@payload, @signature, secret)
        true
      rescue SecurityError
        false
      end

      def secret
        ENV["RAZORPAY_OAUTH_WEBHOOK_SECRET"]
      end

      def fail_with(message, code = nil)
        @error = message
        @error_code = code
        false
      end
  end
end
