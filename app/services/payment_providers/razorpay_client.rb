# frozen_string_literal: true

require "razorpay"
require "razorpay/request"

module PaymentProviders
  class RazorpayClient
    SDK_MUTEX = Mutex.new

    attr_reader :provider

    def initialize(provider:)
      @provider = provider
    end

    def create_payment_link(payload)
      with_sdk { normalize_response(Razorpay::PaymentLink.create(payload)) }
    end

    def fetch_payment_link(payment_link_id)
      with_sdk { normalize_response(Razorpay::PaymentLink.fetch(payment_link_id)) }
    end

    def create_upi_payout(payload, idempotency_key:)
      with_sdk(headers: { "X-Payout-Idempotency" => idempotency_key }) do
        normalize_response(Razorpay::Request.new("payouts").create(payload))
      end
    end

    def verify_payment_link_signature(attributes)
      with_sdk do
        Razorpay::Utility.verify_payment_link_signature(payment_link_signature_attributes(attributes))
      end
      true
    rescue SecurityError
      false
    end

    def verify_webhook_signature(payload:, signature:, webhook_secret:)
      Razorpay::Utility.verify_webhook_signature(payload, signature, webhook_secret)
      true
    rescue SecurityError
      false
    end

    private

      def with_sdk(headers: {})
        raise Error, "Razorpay key id and key secret are required" unless provider.razorpay_configured?

        # The official Ruby SDK stores auth and custom headers globally.
        # Serialize calls so one company's credentials cannot leak into another request.
        SDK_MUTEX.synchronize do
          previous_auth = Razorpay.auth
          previous_auth_type = Razorpay.auth_type
          previous_access_token = Razorpay.access_token
          previous_headers = Razorpay.custom_headers

          Razorpay.setup(provider.key_id, provider.key_secret)
          Razorpay.headers = headers
          yield
        ensure
          Razorpay.auth = previous_auth
          Razorpay.auth_type = previous_auth_type
          Razorpay.access_token = previous_access_token
          Razorpay.headers = previous_headers || {}
        end
      rescue Razorpay::Error => error
        raise Error, error.message.presence || "Razorpay request failed"
      end

      def normalize_response(response)
        return response.attributes if response.respond_to?(:attributes)

        response
      end

      def payment_link_signature_attributes(attributes)
        {
          payment_link_id: attributes.fetch(:payment_link_id),
          payment_link_reference_id: attributes.fetch(:payment_link_reference_id),
          payment_link_status: attributes.fetch(:payment_link_status),
          razorpay_payment_id: attributes.fetch(:razorpay_payment_id),
          razorpay_signature: attributes.fetch(:razorpay_signature)
        }
      end

      class Error < StandardError; end
  end
end
