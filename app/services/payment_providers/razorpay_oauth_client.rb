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
    class Rejected < Error
      def initialize(message, token_invalid: false)
        super(message)
        @token_invalid = token_invalid
      end

      def token_invalid?
        @token_invalid
      end
    end

    CALLBACK_PATH = "/payments/razorpay/callback"
    MAX_BODY_BYTES = 262_144
    CLIENT_REJECTIONS = [
      "Check the client_id parameter", "Check the client_secret parameter", "Invalid Client or Grant type", "Access denied",
      "Check that all required parameters have been provided"
    ].freeze
    EXCHANGE_REJECTIONS = (CLIENT_REJECTIONS + [
      "Check the redirect_uri parameter", "Client authentication failed", "Only allowed modes are test or live",
      "Mode can be only set to live for production clients", "Cannot decrypt the authorization code",
      "Authorization code has expired", "Authorization code was not issued to this client", "Invalid redirect URI"
    ]).freeze
    INVALID_REFRESH_TOKEN = ["Cannot decrypt the refresh token", "Token is not linked to client", "Token has been revoked"].freeze
    ALREADY_INVALID_TOKEN = "Could not validate the token provided"
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

      tokens(request("token", { grant_type: "authorization_code", code:, redirect_uri: @redirect_uri, mode: @mode },
        rejections: EXCHANGE_REJECTIONS))
    end

    def refresh(refresh_token, account_id:)
      raise Error, "Invalid Razorpay refresh token" unless text?(refresh_token)
      unless account_id.is_a?(String) && account_id.match?(/\Aacc_[A-Za-z0-9]{1,116}\z/)
        raise Error, "Expected Razorpay merchant is required"
      end

      tokens(request("token", { grant_type: "refresh_token", refresh_token: }, rejections: CLIENT_REJECTIONS + INVALID_REFRESH_TOKEN),
        account_id:)
    end

    def revoke(refresh_token)
      raise Error, "Invalid Razorpay refresh token" unless text?(refresh_token)

      result = request("revoke", { token_type_hint: "refresh_token", token: refresh_token }, rejections: [ALREADY_INVALID_TOKEN])
      raise Error, "Razorpay revocation could not be confirmed" unless result["message"] == "Token Revoked"

      true
    rescue Rejected
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

      def request(path, parameters, rejections: [])
        result = JSON.parse(post(path, parameters, rejections), max_nesting: 20, allow_duplicate_key: false)
        raise Error, "Razorpay returned an invalid OAuth response" unless result.is_a?(Hash) && !result.key?("error")

        result
      rescue JSON::ParserError, JSON::NestingError
        raise Error, "Razorpay returned an invalid OAuth response", cause: nil
      rescue IOError, SystemCallError, SocketError, Timeout::Error, OpenSSL::SSL::SSLError, Net::HTTPBadResponse, Net::HTTPHeaderSyntaxError, Net::ProtocolError, Zlib::Error
        raise Error, "Razorpay OAuth request failed", cause: nil
      end

      def post(path, parameters, rejections)
        uri = URI("https://auth.razorpay.com/#{path}")
        body = +""
        Timeout.timeout(15) do
          http_client(uri).request(post_request(uri, parameters)) do |response|
            read_bounded_body(response, body)
            raise failure_for(response, body, rejections) unless response.is_a?(Net::HTTPSuccess)
          end
        end
        body
      end

      def failure_for(response, body, rejections)
        reason = documented_reason(response, body)
        return Error.new("Razorpay OAuth request failed") unless rejections.include?(reason)

        Rejected.new("Razorpay rejected the OAuth request", token_invalid: INVALID_REFRESH_TOKEN.include?(reason))
      end

      def documented_reason(response, body)
        return unless response.code.to_i.between?(400, 499) && %w[408 429].exclude?(response.code)

        parsed = JSON.parse(body, max_nesting: 5)
        return unless parsed.is_a?(Hash)

        error = parsed["error"]
        error.is_a?(Hash) ? error["description"] : parsed["error_description"]
      rescue JSON::ParserError, JSON::NestingError
        nil
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
