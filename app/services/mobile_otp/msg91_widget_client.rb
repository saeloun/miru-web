# frozen_string_literal: true

require "net/http"

module MobileOtp
  class Msg91WidgetClient
    BASE_URL = ENV.fetch("MSG91_WIDGET_BASE_URL", "https://control.msg91.com/api/v5/widget")
    SEND_OTP_URL = "#{BASE_URL}/sendOtp"
    VERIFY_OTP_URL = "#{BASE_URL}/verifyOtp"
    VERIFY_ACCESS_TOKEN_URL = "#{BASE_URL}/verifyAccessToken"
    HTTP_OPEN_TIMEOUT = 5
    HTTP_READ_TIMEOUT = 10

    Response = Struct.new(:req_id, :access_token, :identifier, keyword_init: true)

    class Error < StandardError; end

    def self.configured?
      widget_id.present? && (token_auth.present? || auth_key.present?)
    end

    def self.send_otp(identifier:)
      new.send_otp(identifier:)
    end

    def self.verify_otp(req_id:, otp:)
      new.verify_otp(req_id:, otp:)
    end

    def self.verify_access_token(access_token:)
      new.verify_access_token(access_token:)
    end

    def self.auth_key
      ENV["MSG91_AUTH_KEY"].presence || ENV["MSG91_AUTHKEY"].presence
    end

    def self.token_auth
      ENV["MSG91_TOKEN_AUTH"].presence || ENV["MSG91_TOKENAUTH"].presence
    end

    def self.widget_id
      ENV["MSG91_WIDGET_ID"].presence
    end

    def send_otp(identifier:)
      body = post_json(SEND_OTP_URL, {
        widgetId: widget_id,
        identifier:,
        **token_payload
      })

      unless success_response?(body)
        raise Error, body["message"].presence || body["error"].presence || "MSG91 send OTP failed"
      end

      req_id = body["reqId"].presence || body["req_id"].presence || body["message"].presence
      raise Error, "MSG91 did not return a request id" if req_id.blank?

      Response.new(req_id:)
    end

    def verify_otp(req_id:, otp:)
      body = post_json(VERIFY_OTP_URL, {
        widgetId: widget_id,
        reqId: req_id,
        otp: otp.to_s.gsub(/\D/, ""),
        **token_payload
      })

      message = body["message"].to_s
      access_token = body["access-token"].presence ||
        body["access_token"].presence ||
        body["token"].presence ||
        (message.count(".") >= 2 ? message : nil)

      raise Error, "MSG91 OTP verification failed" unless success_response?(body)

      Response.new(access_token:)
    end

    def verify_access_token(access_token:)
      body = post_json(VERIFY_ACCESS_TOKEN_URL, {
        "access-token": access_token
      })

      identifier = body["identifier"].presence ||
        body["mobile"].presence ||
        body["email"].presence ||
        body["message"].presence
      raise Error, "MSG91 access token verification failed" unless success_response?(body)

      Response.new(identifier:)
    end

    private

      def post_json(url, payload)
        raise Error, "MSG91 OTP widget is not configured" unless self.class.configured?

        uri = URI.parse(url)
        request = Net::HTTP::Post.new(uri)
        request["authkey"] = auth_key if use_auth_key?(url)
        request.content_type = "application/json"
        request.body = payload.to_json

        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
          http.open_timeout = HTTP_OPEN_TIMEOUT
          http.read_timeout = HTTP_READ_TIMEOUT
          http.request(request)
        end

        body = parse_body(response.body)
        raise Error, error_message(body, response) unless response.is_a?(Net::HTTPSuccess)

        body
      rescue JSON::ParserError
        raise Error, "MSG91 returned an invalid response"
      end

      def parse_body(body)
        JSON.parse(body.presence || "{}")
      end

      def success_response?(body)
        message = body["message"].to_s
        successful_message = message.match?(/\b(success(?:ful|fully)?|verified)\b/i) &&
          !message.match?(/\b(unsuccess(?:ful)?|not\s+verified|failed|failure|invalid|error)\b/i)

        body["type"].to_s.casecmp("success").zero? ||
          body["status"].to_s.casecmp("success").zero? ||
          body["success"] == true ||
          successful_message ||
          body["access-token"].present? ||
          body["access_token"].present?
      end

      def error_message(body, response)
        body["message"].presence || body["error"].presence || "MSG91 request failed with HTTP #{response.code}"
      end

      def auth_key
        self.class.auth_key
      end

      def token_auth
        self.class.token_auth
      end

      def token_payload
        token_auth.present? ? { tokenAuth: token_auth } : {}
      end

      def use_auth_key?(url)
        url == VERIFY_ACCESS_TOKEN_URL || token_auth.blank?
      end

      def widget_id
        self.class.widget_id
      end
  end
end
