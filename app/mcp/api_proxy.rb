# frozen_string_literal: true

require "rack/mock"
require "uri"

module MCP
  module Miru
    class ApiProxy
      Result = Struct.new(:status, :headers, :body, :json, keyword_init: true) do
        def success?
          status.to_i.between?(200, 299)
        end

        def to_h
          {
            "status" => status,
            "headers" => headers,
            "body" => body,
            "json" => json
          }
        end

        def self.from_h(hash)
          new(
            status: hash["status"],
            headers: hash["headers"],
            body: hash["body"],
            json: hash["json"]
          )
        end
      end

      class << self
        def request(method:, path:, authorization:, params: nil, body: nil, headers: {})
          full_path = build_path(path:, params:)
          request_options = normalize_headers(default_headers(authorization:).merge(headers))
          request_options[:input] = JSON.generate(body) if body.present?

          response = Rack::MockRequest.new(Rails.application).request(method.to_s.upcase, full_path, request_options)
          response_body = response.body.to_s

          Result.new(
            status: response.status,
            headers: response.headers.to_h,
            body: response_body,
            json: parse_json(response_body)
          )
        end

        private

          def build_path(path:, params:)
            return path if params.blank?

            query = Rack::Utils.build_query(params.compact_blank)
            return path if query.blank?

            "#{path}?#{query}"
          end

          def default_headers(authorization:)
            headers = {
              "HTTP_AUTHORIZATION" => authorization.to_s,
              "HTTP_ACCEPT" => "application/json",
              "CONTENT_TYPE" => "application/json"
            }

            host = default_host
            headers["HTTP_HOST"] = host if host.present?
            headers
          end

          def default_host
            uri = URI.parse(ENV.fetch("APP_BASE_URL", ""))
            return if uri.host.blank?

            if uri.port && uri.port != uri.default_port
              "#{uri.host}:#{uri.port}"
            else
              uri.host
            end
          rescue URI::InvalidURIError
            nil
          end

          def normalize_headers(headers)
            headers.each_with_object({}) do |(key, value), acc|
              normalized = normalize_header_key(key)
              acc[normalized] = value
            end
          end

          def normalize_header_key(key)
            key = key.to_s
            return key if key.start_with?("HTTP_")
            return key if %w[CONTENT_TYPE CONTENT_LENGTH].include?(key)

            "HTTP_#{key.upcase.tr("-", "_")}"
          end

          def parse_json(response_body)
            return if response_body.blank?

            JSON.parse(response_body)
          rescue JSON::ParserError
            nil
          end
      end
    end
  end
end
