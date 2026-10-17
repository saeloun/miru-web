# frozen_string_literal: true

require "net/http"
require "json"
require "bigdecimal"
require "timeout"

module PayrollProviders
  class ReadOnlyClient
    ENDPOINTS = {
      mercury_live: "https://api.mercury.com/api/v1/accounts?limit=1000",
      mercury_sandbox: "https://api-sandbox.mercury.com/api/v1/accounts?limit=1000",
      razorpay: "https://api.razorpay.com/v1/banking_balances?count=100&skip=0"
    }.freeze
    MAX_BODY_BYTES = 262_144

    def initialize(endpoint:, token: nil, key_id: nil, key_secret: nil)
      @uri = URI(ENDPOINTS.fetch(endpoint))
      credentials = endpoint == :razorpay ? [key_id, key_secret] : [token]
      unless credentials.all? { |value| value.is_a?(String) && !value.empty? && !value.match?(/[\r\n]/) }
        raise Error, "Provider credentials are required"
      end
      if endpoint == :razorpay
        @key_id, @key_secret = key_id.dup.freeze, key_secret.dup.freeze
      else
        @token = token.dup.freeze
      end
    rescue KeyError
      raise Error, "Unsupported provider endpoint", cause: nil
    end

    def fetch
      JSON.parse(fetch_body, decimal_class: BigDecimal, max_nesting: 20, allow_duplicate_key: false)
    rescue Error
      raise
    rescue StandardError
      raise Error, "Provider balance request failed", cause: nil
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def request
        request = Net::HTTP::Get.new(@uri)
        request["Accept"] = "application/json"
        request["Accept-Encoding"] = "identity"
        @token ? request["Authorization"] = "Bearer #{@token}" : request.basic_auth(@key_id, @key_secret)
        request
      end

      def fetch_body
        body = +""
        Timeout.timeout(10) do
          Net::HTTP.start(@uri.host, @uri.port, nil, use_ssl: true, open_timeout: 3,
            read_timeout: 5, write_timeout: 5) do |http|
            http.request(request) { |response| read_body(response, body) }
          end
        end
        body
      end

      def read_body(response, body)
        validate_response!(response)
        response.read_body do |chunk|
          raise Error, "Provider response is too large" if body.bytesize + chunk.bytesize > MAX_BODY_BYTES

          body << chunk
        end
      end

      def validate_response!(response)
        raise Error, "Provider balance request rejected" unless response.code == "200"
        unless response["content-type"].to_s.split(";").first.to_s.strip.downcase == "application/json"
          raise Error, "Provider response is not JSON"
        end
        unless [nil, "identity"].include?(response["content-encoding"])
          raise Error, "Unsupported provider response encoding"
        end
        length = response["content-length"]
        if length && (!length.match?(/\A\d+\z/) || length.to_i > MAX_BODY_BYTES)
          raise Error, "Provider response is too large"
        end
      end
  end
end
