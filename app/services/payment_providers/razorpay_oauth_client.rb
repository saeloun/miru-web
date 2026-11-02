# frozen_string_literal: true

require "net/http"
require "timeout"
require "zlib"

module PaymentProviders
  class RazorpayOauthClient
    class Error < StandardError
      def initialize(message, cleanup_grant: nil)
        super(message)
        @cleanup_grant = cleanup_grant
      end

      def as_json(*)
        { "message" => message }
      end

      private

        attr_reader :cleanup_grant
    end
    class Unavailable < Error; end

    CALLBACK_PATH = "/payments/razorpay/callback"
    MAX_BODY_BYTES = 262_144
    attr_reader :identity

    def self.usable_text?(value)
      value.is_a?(String) && value.valid_encoding? && value.present? && value.bytesize <= 16_384 && !value.match?(/[\r\n]/)
    end

    def initialize
      @client_id = ENV["RAZORPAY_OAUTH_CLIENT_ID"]
      @client_secret = ENV["RAZORPAY_OAUTH_CLIENT_SECRET"]
      @redirect_uri = ENV["RAZORPAY_OAUTH_REDIRECT_URI"]
      @mode = ENV["RAZORPAY_OAUTH_MODE"]
      unless ENV["RAZORPAY_OAUTH_ENABLED"] == "true" && text?(@client_id) && text?(@client_secret) &&
          %w[test live].include?(@mode) && valid_redirect?
        raise Unavailable, "Razorpay account connection is not configured"
      end
      @identity = { "client_id" => @client_id, "mode" => @mode, "redirect_uri" => @redirect_uri }.freeze
    end

    def authorization_url(state:)
      unless state.is_a?(String) && state.ascii_only? && state.match?(/\A[0-9a-f]{64}\z/)
        raise Error, "Invalid Razorpay authorization state"
      end
      uri = URI("https://auth.razorpay.com/authorize")
      uri.query = URI.encode_www_form(client_id: @client_id, response_type: "code", redirect_uri: @redirect_uri,
        scope: "read_write", state:)
      uri.to_s
    end

    def exchange(code)
      raise Error, "Invalid Razorpay authorization code" unless text?(code)

      tokens(request("token", grant_type: "authorization_code", code:, redirect_uri: @redirect_uri, mode: @mode))
    end

    def refresh(refresh_token, account_id:)
      raise Error, "Invalid Razorpay refresh token" unless text?(refresh_token)
      unless account_id.is_a?(String) && account_id.match?(/\Aacc_[A-Za-z0-9]{1,116}\z/)
        raise Error, "Expected Razorpay merchant is required"
      end

      tokens(request("token", grant_type: "refresh_token", refresh_token:), account_id:)
    end

    def revoke(refresh_token)
      raise Error, "Invalid Razorpay refresh token" unless text?(refresh_token)

      result = request("revoke", token_type_hint: "refresh_token", token: refresh_token)
      raise Error, "Razorpay revocation could not be confirmed" unless result["message"] == "Token Revoked"

      true
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def valid_redirect?
        return false unless text?(@redirect_uri)

        uri = URI(@redirect_uri)
        local_http = !Rails.env.production? && uri.scheme == "http" && %w[localhost 127.0.0.1].include?(uri.host)
        (uri.scheme == "https" || local_http) && uri.host.present? && uri.userinfo.nil? &&
          uri.path == CALLBACK_PATH && uri.query.nil? && uri.fragment.nil?
      rescue URI::InvalidURIError
        false
      end

      def text?(value)
        self.class.usable_text?(value)
      end

      def request(path, parameters)
        result = JSON.parse(post(path, parameters), max_nesting: 20, allow_duplicate_key: false)
        raise Error, "Razorpay returned an invalid OAuth response" unless result.is_a?(Hash) && !result.key?("error")

        result
      rescue JSON::ParserError, JSON::NestingError
        raise Error, "Razorpay returned an invalid OAuth response", cause: nil
      rescue IOError, SystemCallError, SocketError, Timeout::Error, OpenSSL::SSL::SSLError, Net::HTTPBadResponse, Net::ProtocolError, Zlib::Error
        raise Error, "Razorpay OAuth request failed", cause: nil
      end

      def post(path, parameters)
        uri = URI("https://auth.razorpay.com/#{path}")
        body = +""
        Timeout.timeout(15) do
          http_client(uri).request(post_request(uri, parameters)) do |response|
            raise Error, "Razorpay OAuth request failed" unless response.is_a?(Net::HTTPSuccess)

            read_bounded_body(response, body)
          end
        end
        body
      end

      def http_client(uri)
        Net::HTTP.new(uri.host, uri.port).tap do |http|
          http.use_ssl = true
          http.open_timeout = http.read_timeout = http.write_timeout = 5
        end
      end

      def post_request(uri, parameters)
        Net::HTTP::Post.new(uri, "Content-Type" => "application/json", "Accept" => "application/json").tap do |request|
          request.body = { client_id: @client_id, client_secret: @client_secret }.merge(parameters).to_json
        end
      end

      def read_bounded_body(response, body)
        response.read_body do |chunk|
          body << chunk
          raise Error, "Razorpay returned an invalid OAuth response" if body.bytesize > MAX_BODY_BYTES
        end
      end

      def tokens(result, account_id: nil)
        merchant = result.fetch("razorpay_account_id", account_id)
        expiry = result["expires_in"]
        expiry = expiry.to_i if expiry.is_a?(String) && expiry.match?(/\A[1-9]\d{0,9}\z/)
        unless result["token_type"] == "Bearer" && %w[access_token refresh_token].all? { |key| text?(result[key]) } &&
            result["public_token"].is_a?(String) && result["public_token"].match?(/\Arzp_#{@mode}_oauth_[A-Za-z0-9]+\z/) &&
            merchant.is_a?(String) && merchant.match?(/\Aacc_[A-Za-z0-9]{1,116}\z/) &&
            (account_id.nil? || merchant == account_id) && expiry.is_a?(Integer) && expiry.between?(1, 2_147_483_647)
          cleanup = { "refresh_token" => result["refresh_token"], "identity" => identity } if text?(result["refresh_token"])
          raise Error.new("Razorpay returned an invalid OAuth response", cleanup_grant: cleanup), cause: nil
        end
        result.slice("access_token", "refresh_token", "public_token").merge("expires_in" => expiry, "razorpay_account_id" => merchant)
      end
  end
end
