# frozen_string_literal: true

module PaymentProviders
  class PaypalClient
    SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com"
    LIVE_BASE_URL = "https://api-m.paypal.com"
    WEBHOOK_EVENT_TYPES = ["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"].freeze
    SIGNATURE_HEADERS = {
      auth_algo: "PAYPAL-AUTH-ALGO",
      cert_url: "PAYPAL-CERT-URL",
      transmission_id: "PAYPAL-TRANSMISSION-ID",
      transmission_sig: "PAYPAL-TRANSMISSION-SIG",
      transmission_time: "PAYPAL-TRANSMISSION-TIME"
    }.freeze
    REQUEST_OPEN_TIMEOUT = 5
    REQUEST_TIMEOUT = 15
    TOKEN_CACHE_MARGIN = 60

    class Error < StandardError
      attr_reader :issue, :status

      def initialize(message, issue: nil, status: nil)
        super(message)
        @issue = issue
        @status = status
      end
    end

    attr_reader :provider

    def initialize(provider:)
      @provider = provider
    end

    def base_url
      provider.paypal_sandbox? ? SANDBOX_BASE_URL : LIVE_BASE_URL
    end

    def access_token
      raise Error, "PayPal client ID and secret are required" unless provider.paypal_configured?

      Rails.cache.read(token_cache_key) || fetch_access_token
    end

    def create_order(payload, request_id:)
      post("/v2/checkout/orders", payload, headers: { "PayPal-Request-Id" => request_id, "Prefer" => "return=representation" })
    end

    def show_order(order_id)
      get("/v2/checkout/orders/#{order_id}")
    end

    def capture_order(order_id, request_id:)
      post("/v2/checkout/orders/#{order_id}/capture", {}, headers: { "PayPal-Request-Id" => request_id, "Prefer" => "return=representation" })
    end

    def create_webhook(url:, event_types: WEBHOOK_EVENT_TYPES)
      post("/v1/notifications/webhooks", { url:, event_types: event_types.map { |name| { name: } } })
    end

    def list_webhooks
      Array(get("/v1/notifications/webhooks")["webhooks"])
    end

    def delete_webhook(webhook_id)
      request(:delete, "/v1/notifications/webhooks/#{webhook_id}")
    end

    def verify_webhook_signature(headers:, body:, webhook_id:)
      payload = SIGNATURE_HEADERS.transform_values { |header| headers[header].to_s }
      payload[:webhook_id] = webhook_id
      payload[:webhook_event] = JSON.parse(body)
      response = post("/v1/notifications/verify-webhook-signature", payload)
      response["verification_status"] == "SUCCESS"
    rescue JSON::ParserError
      false
    end

    private

      def get(path)
        request(:get, path)
      end

      def post(path, payload, headers: {})
        request(:post, path, body: JSON.generate(payload), headers:)
      end

      def request(method, path, body: nil, headers: {}, retry_on_unauthorized: true)
        response = http.run_request(method, path, body, headers.merge("Authorization" => "Bearer #{access_token}"))
        if response.status == 401 && retry_on_unauthorized
          Rails.cache.delete(token_cache_key)
          return request(method, path, body:, headers:, retry_on_unauthorized: false)
        end

        parsed_response(response)
      rescue Faraday::Error => error
        raise Error.new("PayPal request failed: #{error.class.name.demodulize}")
      end

      def fetch_access_token
        response = Faraday.new(url: base_url, request: timeout_options) do |faraday|
          faraday.request :url_encoded
          faraday.request :authorization, :basic, provider.client_id, provider.client_secret
          faraday.headers["Accept"] = "application/json"
        end.post("/v1/oauth2/token", grant_type: "client_credentials")

        body = parsed_response(response)
        token = body.fetch("access_token")
        ttl = [body["expires_in"].to_i - TOKEN_CACHE_MARGIN, TOKEN_CACHE_MARGIN].max
        Rails.cache.write(token_cache_key, token, expires_in: ttl.seconds)
        token
      rescue Faraday::Error => error
        raise Error.new("PayPal request failed: #{error.class.name.demodulize}")
      end

      def http
        Faraday.new(url: base_url, request: timeout_options) do |faraday|
          faraday.headers["Accept"] = "application/json"
          faraday.headers["Content-Type"] = "application/json"
        end
      end

      def timeout_options
        { open_timeout: REQUEST_OPEN_TIMEOUT, timeout: REQUEST_TIMEOUT }
      end

      # The secret is part of the key so a re-saved or rotated credential cannot ride the previous token.
      def token_cache_key
        credentials = Digest::SHA256.hexdigest("#{provider.client_id}:#{provider.client_secret}")
        "paypal:access_token:#{provider.paypal_environment}:#{provider.company_id}:#{credentials}"
      end

      def parsed_response(response)
        body = response.body.present? ? JSON.parse(response.body) : {}
        return body if response.success?

        detail = Array(body["details"]).first || {}
        message = detail["description"].presence ||
          body["error_description"].presence ||
          body["message"].presence ||
          body["error"].presence ||
          "PayPal API request failed"
        raise Error.new(message, issue: detail["issue"].presence || body["name"].presence, status: response.status)
      rescue JSON::ParserError
        raise Error.new("PayPal API returned an invalid response", status: response.status)
      end
  end
end
