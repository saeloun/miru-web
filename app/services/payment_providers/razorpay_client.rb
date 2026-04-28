# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module PaymentProviders
  class RazorpayClient
    API_BASE_URL = "https://api.razorpay.com/v1"

    attr_reader :provider

    def initialize(provider:)
      @provider = provider
    end

    def create_payment_link(payload)
      request_json(:post, "/payment_links", payload)
    end

    def fetch_payment_link(payment_link_id)
      request_json(:get, "/payment_links/#{payment_link_id}")
    end

    private

      def request_json(method, path, payload = nil)
        uri = URI("#{API_BASE_URL}#{path}")
        request = request_for(method, uri)
        request.basic_auth(provider.key_id, provider.key_secret)
        request["Content-Type"] = "application/json"
        request.body = payload.to_json if payload.present?

        response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
          http.request(request)
        end

        parsed = JSON.parse(response.body.presence || "{}")
        return parsed if response.is_a?(Net::HTTPSuccess)

        message = parsed.dig("error", "description") || parsed["error"] || "Razorpay request failed"
        raise Error, message
      rescue JSON::ParserError
        raise Error, "Razorpay returned an invalid response"
      end

      def request_for(method, uri)
        case method
        when :get
          Net::HTTP::Get.new(uri)
        when :post
          Net::HTTP::Post.new(uri)
        else
          raise ArgumentError, "Unsupported Razorpay request method"
        end
      end

      class Error < StandardError; end
  end
end
