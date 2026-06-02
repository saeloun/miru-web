# frozen_string_literal: true

module QuickBooks
  class Client
    def initialize(connection:, token_refresher: nil, configuration: Configuration)
      @connection = connection
      @token_refresher = token_refresher || TokenRefresher.new(connection:)
      @configuration = configuration
    end

    def company_info
      get("/v3/company/#{connection.realm_id}/companyinfo/#{connection.realm_id}")
    end

    def get(path, params = {})
      ensure_access_token!
      response = http.get(path) do |request|
        request.params.update(default_params.merge(params))
      end
      parsed_response(response)
    end

    def post(path, payload, params = {})
      ensure_access_token!
      response = http.post(path) do |request|
        request.params.update(default_params.merge(params))
        request.body = JSON.generate(payload)
      end
      parsed_response(response)
    end

    private

      attr_reader :connection, :token_refresher, :configuration

      def ensure_access_token!
        token_refresher.refresh! if connection.access_token_expired?
      end

      def http
        Faraday.new(
          url: configuration.base_url(connection.environment),
          request: configuration.request_timeout_options
        ) do |faraday|
          faraday.headers["Accept"] = "application/json"
          faraday.headers["Content-Type"] = "application/json"
          faraday.request :authorization, "Bearer", connection.access_token
        end
      end

      def default_params
        { minorversion: configuration.minor_version }
      end

      def parsed_response(response)
        body = response.body.present? ? JSON.parse(response.body) : {}
        return body if response.success?

        message = body.dig("Fault", "Error", 0, "Message").presence ||
          body["error_description"].presence ||
          body["error"].presence ||
          "QuickBooks API request failed"
        raise Error.new(message, response:)
      rescue JSON::ParserError
        raise Error.new("QuickBooks API returned an invalid response", response:)
      end
  end
end
