# frozen_string_literal: true

module PaymentProviders
  class PaypalConnectionService
    NON_HTTPS_WEBHOOK_ERROR = "Webhook registration needs a public HTTPS URL"

    attr_reader :provider, :webhook_url, :error

    def initialize(provider:, webhook_url: nil)
      @provider = provider
      @webhook_url = webhook_url.to_s
    end

    def process
      unless provider.paypal_configured?
        provider.connected = false
        return save_provider
      end

      client.access_token
      provider.connected = true
      register_webhook if webhook_registration_needed?
      save_provider
    rescue PaypalClient::Error => exception
      @error = exception.message
      provider.connected = false
      provider.enabled = false
      provider.webhook_id = nil
      provider.save
      false
    end

    def disconnect!
      delete_webhook
      provider.destroy!
    end

    private

      def save_provider
        return true if provider.save

        @error = provider.errors.full_messages.to_sentence
        false
      end

      def webhook_registration_needed?
        provider.webhook_id.blank? ||
          provider.webhook_client_id != provider.client_id ||
          provider.webhook_environment != provider.paypal_environment
      end

      def register_webhook
        provider.webhook_id = nil
        unless webhook_url.start_with?("https://")
          provider.webhook_error = NON_HTTPS_WEBHOOK_ERROR
          return
        end

        webhook = client.create_webhook(url: webhook_url)
        remember_webhook(webhook["id"])
      rescue PaypalClient::Error => exception
        existing = existing_webhook_id if exception.issue == "WEBHOOK_URL_ALREADY_EXISTS"
        if existing.present?
          remember_webhook(existing)
        else
          provider.webhook_error = exception.message
        end
      end

      def existing_webhook_id
        client.list_webhooks.find { |webhook| webhook["url"] == webhook_url }&.dig("id")
      rescue PaypalClient::Error
        nil
      end

      def remember_webhook(webhook_id)
        provider.webhook_id = webhook_id
        provider.webhook_client_id = provider.client_id
        provider.webhook_environment = provider.paypal_environment
        provider.webhook_error = nil
      end

      def delete_webhook
        return if provider.webhook_id.blank? || !provider.paypal_configured?

        client.delete_webhook(provider.webhook_id)
      rescue PaypalClient::Error => exception
        Rails.logger.info("PayPal webhook delete skipped for provider #{provider.id}: #{exception.message}")
      end

      def client
        @_client ||= PaypalClient.new(provider:)
      end
  end
end
