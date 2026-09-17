# frozen_string_literal: true

module PaymentProviders
  class PaypalConnectionService
    NON_HTTPS_WEBHOOK_ERROR = "Webhook registration needs a public HTTPS URL"
    RETRYABLE_STATUSES = [408, 429].freeze

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
      webhook_registration_needed? ? register_webhook : save_provider
    rescue PaypalClient::Error => exception
      @error = exception.message
      if credentials_rejected?(exception)
        provider.connected = false
        provider.enabled = false
        provider.webhook_id = nil
        unless provider.save
          @error = [exception.message, provider.errors.full_messages.to_sentence].compact_blank.join(". ")
        end
      else
        Rails.logger.warn(
          "[PayPal] connection check could not reach PayPal, keeping the current connection " \
          "provider_id=#{provider.id} error=#{exception.message}"
        )
      end
      false
    end

    def disconnect!
      delete_webhook(provider.webhook_id)
      provider.destroy!
    end

    private

      def credentials_rejected?(exception)
        exception.status.present? && exception.status.between?(400, 499) && !RETRYABLE_STATUSES.include?(exception.status)
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
        previous = previous_webhook_id

        unless webhook_url.start_with?("https://")
          return fail_webhook_registration(NON_HTTPS_WEBHOOK_ERROR)
        end

        webhook = client.create_webhook(url: webhook_url)
        replace_webhook(previous, webhook["id"])
      rescue PaypalClient::Error => exception
        existing = existing_webhook_id if exception.issue == "WEBHOOK_URL_ALREADY_EXISTS"
        if existing.present?
          replace_webhook(previous, existing)
        else
          fail_webhook_registration(exception.message, issue: exception.issue)
        end
      end

      def replace_webhook(previous_id, webhook_id)
        remember_webhook(webhook_id)
        return false unless save_provider

        retire_webhook(previous_id)
        true
      end

      def fail_webhook_registration(message, issue: nil)
        @error = message
        provider.webhook_error = message
        Rails.logger.warn(
          "[PayPal] webhook registration failed provider_id=#{provider.id} url=#{webhook_url} " \
          "issue=#{issue} error=#{message}"
        )
        false
      end

      def previous_webhook_id
        return if provider.webhook_id.blank?

        if provider.webhook_client_id == provider.client_id && provider.webhook_environment == provider.paypal_environment
          provider.webhook_id
        else
          Rails.logger.warn(
            "PayPal webhook #{provider.webhook_id} is orphaned on app #{provider.webhook_client_id} " \
            "(#{provider.webhook_environment}) for provider #{provider.id}; remove it in the PayPal dashboard"
          )
          nil
        end
      end

      def retire_webhook(previous_id)
        return if previous_id.blank? || previous_id == provider.webhook_id

        delete_webhook(previous_id)
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
