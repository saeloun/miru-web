# frozen_string_literal: true

require "base64"

module QuickBooks
  class OauthClient
    def initialize(configuration: Configuration)
      @configuration = configuration
    end

    def authorization_uri(state:)
      uri = URI(configuration::AUTHORIZATION_URL)
      uri.query = URI.encode_www_form(
        client_id: configuration.client_id,
        response_type: "code",
        scope: configuration::ACCOUNTING_SCOPE,
        redirect_uri: configuration.redirect_uri,
        state:
      )
      uri.to_s
    end

    def exchange_code!(code)
      token_request!(
        grant_type: "authorization_code",
        code:,
        redirect_uri: configuration.redirect_uri
      )
    end

    def refresh!(refresh_token)
      token_request!(
        grant_type: "refresh_token",
        refresh_token:
      )
    end

    private

      attr_reader :configuration

      def token_request!(params)
        response = http.post do |request|
          request.headers["Authorization"] = "Basic #{basic_auth_token}"
          request.headers["Accept"] = "application/json"
          request.headers["Content-Type"] = "application/x-www-form-urlencoded"
          request.body = URI.encode_www_form(params)
        end

        parsed_response(response)
      end

      def parsed_response(response)
        body = response.body.present? ? JSON.parse(response.body) : {}
        return body if response.success?

        message = body["error_description"].presence || body["error"].presence || "QuickBooks OAuth request failed"
        raise Error.new(message, response:)
      rescue JSON::ParserError
        raise Error.new("QuickBooks OAuth returned an invalid response", response:)
      end

      def basic_auth_token
        Base64.strict_encode64("#{configuration.client_id}:#{configuration.client_secret}")
      end

      def http
        Faraday.new(url: configuration::TOKEN_URL, request: configuration.request_timeout_options)
      end
  end
end
