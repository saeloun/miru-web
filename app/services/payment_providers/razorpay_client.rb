# frozen_string_literal: true

require "razorpay"
require "razorpay/request"

module PaymentProviders
  class RazorpayClient
    class Error < StandardError; end
    class NotSent < Error; end
    class CreationRejected < Error; end

    SDK_MUTEX = Mutex.new
    # Exact documented create errors, excluding the duplicate-reference error, prove input was rejected.
    CREATION_REJECTIONS = [
      "wrong input fields sent.", "extra fields sent.", "amount: cannot be blank.",
      "amount: amount should be minimum 100 for INR.",
      "amount, should be a whole number for e.g. 2234 to create a payment link for INR 22.34.",
      "amount: currency: wrong input field, please find the list of supported currencies on the documentation.",
      "email: must be in a valid format for e.g. abcxyz@domain.com.", "contact: the length must be between 8 and 14.",
      "reference_id: the length must be no more than 40.", "callback_url: URL should be sent in callback_url field.",
      "callback_method: must be a valid value.", "customer name is a mandatory field.", "expires by is a mandatory field.",
      "Invalid access: Cannot create a payment link in live mode, as live mode is disabled for merchant.",
      "Invalid access: Cannot create a payment link, as Merchant is Suspended."
    ].freeze

    attr_reader :provider

    def initialize(provider:)
      @provider = provider
    end

    def prepare_oauth!
      oauth_access_token if provider.razorpay_oauth?
    end

    def create_payment_link(payload, expected_context: nil)
      payment_link_request(:post, "", JSON.generate(payload), expected_context:)
    end

    def fetch_payment_link(payment_link_id, expected_context: nil)
      payment_link_request(:get, "/#{payment_link_id}", expected_context:)
    end

    def find_payment_links(reference_id, expected_context: nil)
      payment_link_request(:get, "/", { reference_id: }, expected_context:)["payment_links"]
    end

    def notify_payment_link(payment_link_id, medium)
      payment_link_request(:post, "/#{payment_link_id}/notify_by/#{medium}")
    end

    def cancel_payment_link(payment_link_id, expected_context: nil)
      payment_link_request(:post, "/#{payment_link_id}/cancel", expected_context:)
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
      def payment_link_request(method, path, payload = {}, expected_context: nil)
        with_sdk(headers: { "Content-Type" => "application/json" }, oauth: true, expected_context:) do
          response = Razorpay::Request.new("payment_links").raw_request(method, "/v1/payment_links#{path}", payload)
          body = response.parsed_response
          unless response.code == 200 && body.is_a?(Hash) && !body.key?("error")
            description = body.dig("error", "description") if body.is_a?(Hash) && body["error"].is_a?(Hash)
            error_class = definitive_create_rejection?(method, path, response.code, body, description) ? CreationRejected : Error
            raise error_class, description.is_a?(String) && description.present? ? description : "Razorpay request could not be confirmed", cause: nil
          end

          body
        end
      rescue JSON::ParserError
        raise Error, "Razorpay request could not be confirmed", cause: nil
      end

      def definitive_create_rejection?(method, path, status, body, description)
        return false unless method == :post && path.empty? && body.is_a?(Hash) && body["error"].is_a?(Hash) && body.dig("error", "code") == "BAD_REQUEST_ERROR"

        (status == 400 && CREATION_REJECTIONS.include?(description)) ||
          ([400, 401, 403].include?(status) && description == "The api key provided is invalid")
      end

      def with_sdk(headers: {}, oauth: false, expected_context: nil)
        access_token = oauth_access_token if oauth && provider.razorpay_oauth?
        raise Error, "Razorpay key id and key secret are required" unless access_token || provider.razorpay_configured?
        validate_context!(access_token, expected_context)

        # The official Ruby SDK stores auth and custom headers globally.
        # Serialize calls so one company's credentials cannot leak into another request.
        SDK_MUTEX.synchronize do
          previous = { auth: Razorpay.auth, auth_type: Razorpay.auth_type,
            access_token: Razorpay.access_token, headers: Razorpay.custom_headers }

          configure_sdk(access_token, headers)
          yield
        ensure
          Razorpay.auth = previous[:auth]
          Razorpay.auth_type = previous[:auth_type]
          Razorpay.access_token = previous[:access_token]
          Razorpay.headers = previous[:headers] || {}
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

      def validate_context!(access_token, expected_context)
        return unless expected_context && (!access_token || oauth_context != expected_context)

        raise NotSent, "Razorpay account changed before the request was sent"
      end

      def oauth_context
        { "account_id" => provider.settings["oauth_account_id"], "mode" => provider.settings["oauth_mode"],
          "client_id" => provider.settings["oauth_client_id"] }
      end

      def oauth_access_token
        PaymentProviders::RazorpayOauthConnection.new(provider:, actor: nil).access_token
      rescue PaymentProviders::RazorpayOauthConnection::Error
        raise NotSent, "Razorpay account connection is unavailable", cause: nil
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
  end
end
