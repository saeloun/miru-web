# frozen_string_literal: true

require "net/http"
require "json"
require "bigdecimal"
require "timeout"

module PayrollProviders
  class MercuryClient
    class Rejected < Error
      attr_reader :status

      def initialize(status)
        @status = status
        super("Mercury rejected the request")
      end
    end
    class Ambiguous < Error; end
    class Malformed < Ambiguous; end
    class WritesDisabled < Error; end

    HOSTS = { "live" => "api.mercury.com", "sandbox" => "api-sandbox.mercury.com" }.freeze
    IDENTIFIER = PayrollMercuryConnection::UUID
    MAX_BODY_BYTES = 262_144
    MAX_AMOUNT_MINOR = 1_000_000_000
    TRANSACTIONS_PAGE_LIMIT = 50
    REQUESTS_PAGE_LIMIT = 200

    def initialize(environment:, company_id:, token:)
      @host = HOSTS[environment]
      raise Error, "Unsupported Mercury environment" unless @host
      unless token.is_a?(String) && !token.empty? && !token.match?(/[\r\n]/)
        raise Error, "Mercury credentials are required"
      end

      @environment = environment
      @company_id = company_id
      @token = token.dup.freeze
    end

    def account(id)
      get("/account/#{identifier(id)}")
    end

    def recipient(id)
      get("/recipient/#{identifier(id)}")
    end

    def send_money_request(id)
      get("/request-send-money/#{identifier(id)}")
    end

    def send_money_requests(account_id:, start_after: nil)
      query = { accountId: identifier(account_id), limit: REQUESTS_PAGE_LIMIT }
      query[:start_after] = identifier(start_after) if start_after
      get("/request-send-money", query)
    end

    def request_transactions(account_id:, request_id:, start:)
      get("/account/#{identifier(account_id)}/transactions",
        { limit: TRANSACTIONS_PAGE_LIMIT, requestId: identifier(request_id), start: start.iso8601 })
    end

    def create_send_money_request(account_id:, amount_minor:, body:)
      Payroll::Entitlement.require!(@company_id)
      raise WritesDisabled, "Mercury writes are off" unless Payroll::MercuryWrites.enabled?(@company_id, @environment)

      path = "/account/#{identifier(account_id)}/request-send-money"
      perform(Net::HTTP::Post.new(uri(path)), encoded_body(amount_minor, body))
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end
    alias_method :to_s, :inspect

    private

      def identifier(value)
        return value if value.is_a?(String) && value.match?(IDENTIFIER)

        raise Error, "Invalid Mercury identifier"
      end

      def encoded_body(amount_minor, body)
        unless amount_minor.is_a?(Integer) && amount_minor.between?(1, MAX_AMOUNT_MINOR) && !body.key?("amount")
          raise Error, "Invalid Mercury amount"
        end

        %({"amount":#{amount_minor / 100}.#{format('%02d', amount_minor % 100)},#{JSON.generate(body).delete_prefix('{')})
      end

      def uri(path, query = nil)
        URI::HTTPS.build(host: @host, path: "/api/v1#{path}", query: query && URI.encode_www_form(query.sort.to_h))
      end

      def get(path, query = nil)
        Payroll::Entitlement.require!(@company_id)
        perform(Net::HTTP::Get.new(uri(path, query)))
      end

      def perform(request, payload = nil)
        request["Accept"] = "application/json"
        request["Accept-Encoding"] = "identity"
        request["Authorization"] = "Bearer #{@token}"
        if payload
          request["Content-Type"] = "application/json"
          request.body = payload
        end
        parse(exchange(request))
      rescue Error, Payroll::Entitlement::NotEnabled
        raise
      rescue StandardError
        raise Ambiguous, "Mercury request outcome is unknown", cause: nil
      end

      def exchange(request)
        body = +""
        Timeout.timeout(20) do
          Net::HTTP.start(@host, 443, nil, use_ssl: true, open_timeout: 3, read_timeout: 12, write_timeout: 5, max_retries: 0) do |http|
            http.request(request) { |response| read_body(response, body) }
          end
        end
        body
      end

      def read_body(response, body)
        validate_response!(response)
        response.read_body do |chunk|
          raise Malformed, "Mercury response is too large" if body.bytesize + chunk.bytesize > MAX_BODY_BYTES

          body << chunk
        end
      end

      def validate_response!(response)
        code = response.code.to_i
        raise Rejected.new(code) if code.between?(400, 499) && code != 408 && code != 429
        raise Ambiguous, "Mercury request outcome is unknown" unless code == 200
        unless response["content-type"].to_s.split(";").first.to_s.strip.casecmp?("application/json")
          raise Malformed, "Mercury response is not JSON"
        end
        raise Malformed, "Unsupported Mercury response encoding" unless [nil, "identity"].include?(response["content-encoding"])
      end

      def parse(body)
        parsed = JSON.parse(body, decimal_class: BigDecimal, max_nesting: 20, allow_duplicate_key: false)
        parsed.is_a?(Hash) ? parsed : raise(Malformed, "Mercury response is malformed")
      rescue JSON::ParserError
        raise Malformed, "Mercury response is malformed", cause: nil
      end
  end
end
