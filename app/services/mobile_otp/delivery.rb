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
      return deliver_whatsapp if whatsapp_configured?
      return log_delivery(false) if webhook_endpoint.blank?

      post_json(webhook_uri, webhook_payload, webhook_headers)
    rescue StandardError => error
      Rails.logger.warn("Mobile OTP delivery failed for #{phone}: #{error.message}")
      false
    end

    private

      attr_reader :phone, :code, :company

      def deliver_whatsapp
        post_json(whatsapp_uri, whatsapp_payload, whatsapp_headers)
      end

      def post_json(uri, payload, headers)
        request = Net::HTTP::Post.new(uri)
        headers.each { |key, value| request[key] = value if value.present? }
        request.content_type = "application/json"
        request.body = payload.to_json

        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
          http.request(request)
        end

        response.is_a?(Net::HTTPSuccess)
      end

      def webhook_uri
        @_webhook_uri ||= URI.parse(webhook_endpoint)
      end

      def webhook_endpoint
        ENV["MIRU_MOBILE_OTP_SMS_URL"].to_s
      end

      def webhook_headers
        {
          "Authorization" => webhook_auth_token.present? ? "Bearer #{webhook_auth_token}" : nil
        }
      end

      def webhook_payload
        {
          to: phone,
          message:,
          code:
        }
      end

      def webhook_auth_token
        ENV["MIRU_MOBILE_OTP_SMS_AUTH_TOKEN"].to_s
      end

      def whatsapp_configured?
        whatsapp_phone_number_id.present? && whatsapp_access_token.present?
      end

      def whatsapp_uri
        @_whatsapp_uri ||= URI.parse(
          "https://graph.facebook.com/#{whatsapp_api_version}/#{whatsapp_phone_number_id}/messages"
        )
      end

      def whatsapp_headers
        {
          "Authorization" => "Bearer #{whatsapp_access_token}"
        }
      end

      def whatsapp_payload
        {
          messaging_product: "whatsapp",
          to: phone.gsub(/\D/, ""),
          type: "template",
          template: {
            name: whatsapp_template_name,
            language: {
              code: whatsapp_template_language
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: code
                  }
                ]
              }
            ]
          }
        }
      end

      def whatsapp_api_version
        ENV.fetch("WHATSAPP_CLOUD_API_VERSION", "v22.0")
      end

      def whatsapp_phone_number_id
        ENV["WHATSAPP_CLOUD_PHONE_NUMBER_ID"].to_s
      end

      def whatsapp_access_token
        ENV["WHATSAPP_CLOUD_API_TOKEN"].to_s
      end

      def whatsapp_template_name
        ENV.fetch("WHATSAPP_OTP_TEMPLATE_NAME", "miru_login_otp")
      end

      def whatsapp_template_language
        ENV.fetch("WHATSAPP_OTP_TEMPLATE_LANGUAGE", "en_US")
      end

      def message
        "#{code} is your #{company.name} Miru login code. It expires in 10 minutes."
      end

      def log_delivery(delivered)
        Rails.logger.info("Mobile OTP for #{phone}: #{code}") unless Rails.env.production?
        delivered
      end
  end
end
