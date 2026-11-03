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

    def prepare_oauth!
      oauth_access_token if provider.razorpay_oauth?
    end

    def create_payment_link(payload)
      payment_link_request(:post, "", JSON.generate(payload))
    end

    def fetch_payment_link(payment_link_id)
      payment_link_request(:get, "/#{payment_link_id}")
    end

    def notify_payment_link(payment_link_id, medium)
      payment_link_request(:post, "/#{payment_link_id}/notify_by/#{medium}")
    end

    def cancel_payment_link(payment_link_id)
      payment_link_request(:post, "/#{payment_link_id}/cancel")
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

      # The SDK's entity parser crashes on HTML gateway errors; validate the response at its request layer.
      def payment_link_request(method, path, payload = {})
        with_sdk(headers: { "Content-Type" => "application/json" }, oauth: true) do
          response = Razorpay::Request.new("payment_links").raw_request(method, "/v1/payment_links#{path}", payload)
          body = response.parsed_response
          unless response.code == 200 && body.is_a?(Hash) && !body.key?("error")
            description = body.dig("error", "description") if body.is_a?(Hash) && body["error"].is_a?(Hash)
            raise Error, description.is_a?(String) && description.present? ? description : "Razorpay request could not be confirmed", cause: nil
          end

          body
        end
      rescue JSON::ParserError
        raise Error, "Razorpay request could not be confirmed", cause: nil
      end

      def with_sdk(headers: {}, oauth: false)
        access_token = oauth_access_token if oauth && provider.razorpay_oauth?
        raise Error, "Razorpay key id and key secret are required" unless access_token || provider.razorpay_configured?

        # The official Ruby SDK stores auth and custom headers globally.
        # Serialize calls so one company's credentials cannot leak into another request.
        SDK_MUTEX.synchronize do
          previous_auth = Razorpay.auth
          previous_auth_type = Razorpay.auth_type
          previous_access_token = Razorpay.access_token
          previous_headers = Razorpay.custom_headers

          configure_sdk(access_token, headers)
          yield
        ensure
          Razorpay.auth = previous_auth
          Razorpay.auth_type = previous_auth_type
          Razorpay.access_token = previous_access_token
          Razorpay.headers = previous_headers || {}
        end
      rescue Razorpay::Error => error
        raise Error, error.message.presence || "Razorpay request failed"
      rescue IOError, SystemCallError, SocketError, Timeout::Error, OpenSSL::SSL::SSLError, Net::ProtocolError, HTTParty::Error
        raise Error, "Razorpay request could not be confirmed", cause: nil
      end

      def configure_sdk(access_token, headers)
        access_token ? Razorpay.setup_with_oauth(access_token) : Razorpay.setup(provider.key_id, provider.key_secret)
        Razorpay.headers = headers
      end

      def oauth_access_token
        PaymentProviders::RazorpayOauthConnection.new(provider:, actor: nil).access_token
      rescue PaymentProviders::RazorpayOauthConnection::Error
        raise Error, "Razorpay account connection is unavailable", cause: nil
      end

      def normalize_response(response)
        return response.parsed_response if response.respond_to?(:parsed_response)
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
