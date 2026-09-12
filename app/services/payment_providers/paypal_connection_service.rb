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
      if credentials_rejected?(exception)
        provider.connected = false
        provider.enabled = false
        provider.webhook_id = nil
      else
        Rails.logger.warn(
          "[PayPal] connection check could not reach PayPal, keeping the current connection " \
          "provider_id=#{provider.id} error=#{exception.message}"
        )
      end

      unless provider.save
        @error = [exception.message, provider.errors.full_messages.to_sentence].compact_blank.join(". ")
      end
      false
    end

    def disconnect!
      delete_webhook(provider.webhook_id)
      provider.destroy!
    end

    private

      def credentials_rejected?(exception)
        exception.status.present? && exception.status.between?(400, 499)
      end

      def save_provider
        return true if provider.save

        @error = provider.errors.full_messages.to_sentence
        false
      end

      def webhook_registration_needed?
        provider.webhook_id.blank? ||
          provider.webhook_client_id != provider.client_id ||
          provider.webhook_environment != provider.paypal_environment ||
          normalize_url(provider.webhook_url) != normalize_url(webhook_url)
      end

      def register_webhook
        retire_previous_webhook

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
          Rails.logger.warn(
            "[PayPal] webhook registration failed provider_id=#{provider.id} url=#{webhook_url} " \
            "issue=#{exception.issue} error=#{exception.message}"
          )
        end
      end

      def retire_previous_webhook
        previous_id = provider.webhook_id
        provider.webhook_id = nil
        return if previous_id.blank?

        if provider.webhook_client_id == provider.client_id && provider.webhook_environment == provider.paypal_environment
          delete_webhook(previous_id)
        else
          Rails.logger.warn(
            "PayPal webhook #{previous_id} is orphaned on app #{provider.webhook_client_id} " \
            "(#{provider.webhook_environment}) for provider #{provider.id}; remove it in the PayPal dashboard"
          )
        end
      end

      def existing_webhook_id
        client.list_webhooks.find { |webhook| normalize_url(webhook["url"]) == normalize_url(webhook_url) }&.dig("id")
      rescue PaypalClient::Error
        nil
      end

      def normalize_url(value)
        value.to_s.strip.downcase.delete_suffix("/")
      end

      def remember_webhook(webhook_id)
        provider.webhook_id = webhook_id
        provider.webhook_client_id = provider.client_id
        provider.webhook_environment = provider.paypal_environment
        provider.webhook_url = webhook_url
        provider.webhook_error = nil
      end

      def delete_webhook(webhook_id)
        return if webhook_id.blank? || !provider.paypal_configured?

        client.delete_webhook(webhook_id)
      rescue PaypalClient::Error => exception
        Rails.logger.info("PayPal webhook delete skipped for provider #{provider.id}: #{exception.message}")
      end

      def client
        @_client ||= PaypalClient.new(provider:)
      end
  end
end
