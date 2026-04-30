# frozen_string_literal: true

require "net/http"

module MobileOtp
  class Delivery
    def self.deliver(phone:, code:, company:)
      new(phone:, code:, company:).deliver
    end

    def initialize(phone:, code:, company:)
      @phone = phone
      @code = code
      @company = company
    end

    def deliver
      return log_delivery(false) if endpoint.blank?
      return true if Rails.env.test?

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
        http.request(request)
      end

      response.is_a?(Net::HTTPSuccess)
    rescue StandardError => error
      Rails.logger.warn("Mobile OTP SMS delivery failed for #{phone}: #{error.message}")
      false
    end

    private

      attr_reader :phone, :code, :company

      def request
        Net::HTTP::Post.new(uri).tap do |request|
          request["Authorization"] = "Bearer #{auth_token}" if auth_token.present?
          request.content_type = "application/json"
          request.body = {
            to: phone,
            message: "#{code} is your #{company.name} Miru login code. It expires in 10 minutes.",
            code:
          }.to_json
        end
      end

      def uri
        @_uri ||= URI.parse(endpoint)
      end

      def endpoint
        ENV["MIRU_MOBILE_OTP_SMS_URL"].to_s
      end

      def auth_token
        ENV["MIRU_MOBILE_OTP_SMS_AUTH_TOKEN"].to_s
      end

      def log_delivery(delivered)
        Rails.logger.info("Mobile OTP for #{phone}: #{code}") unless Rails.env.production?
        delivered
      end
  end
end
