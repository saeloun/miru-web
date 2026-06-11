# frozen_string_literal: true

module QuickBooks
  class Configuration
    AUTHORIZATION_URL = "https://appcenter.intuit.com/connect/oauth2"
    TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    ACCOUNTING_SCOPE = "com.intuit.quickbooks.accounting"
    SANDBOX_BASE_URL = "https://sandbox-quickbooks.api.intuit.com"
    PRODUCTION_BASE_URL = "https://quickbooks.api.intuit.com"
    DEFAULT_MINOR_VERSION = "75"
    REQUEST_OPEN_TIMEOUT = 5
    REQUEST_TIMEOUT = 15

    class << self
      def client_id
        env_or_credentials("QUICKBOOKS_CLIENT_ID", "INTUIT_CLIENT_ID", "QBO_CLIENT_ID", credential_key: :client_id)
      end

      def client_secret
        env_or_credentials(
          "QUICKBOOKS_CLIENT_SECRET",
          "INTUIT_CLIENT_SECRET",
          "QBO_CLIENT_SECRET",
          credential_key: :client_secret
        )
      end

      def redirect_uri
        ENV["QUICKBOOKS_REDIRECT_URI"].presence ||
          ENV["INTUIT_REDIRECT_URI"].presence ||
          default_redirect_uri
      end

      def environment
        value = ENV["QUICKBOOKS_ENVIRONMENT"].presence ||
          ENV["INTUIT_ENVIRONMENT"].presence ||
          Rails.application.credentials.dig(:quickbooks, :environment).presence ||
          "sandbox"

        value.to_s == "production" ? "production" : "sandbox"
      end

      def minor_version
        ENV["QUICKBOOKS_MINOR_VERSION"].presence ||
          Rails.application.credentials.dig(:quickbooks, :minor_version).presence ||
          DEFAULT_MINOR_VERSION
      end

      def webhook_verifier_token
        env_or_credentials(
          "QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN",
          "INTUIT_WEBHOOK_VERIFIER_TOKEN",
          "QBO_WEBHOOK_VERIFIER_TOKEN",
          credential_key: :webhook_verifier_token
        )
      end

      def base_url(environment_name = environment)
        environment_name.to_s == "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL
      end

      def configured?
        client_id.present? && client_secret.present? && redirect_uri.present?
      end

      def request_timeout_options
        {
          open_timeout: REQUEST_OPEN_TIMEOUT,
          timeout: REQUEST_TIMEOUT
        }
      end

      private

        def env_or_credentials(*env_names, credential_key:)
          env_names.each do |env_name|
            value = ENV[env_name].presence
            return value if value.present?
          end

          Rails.application.credentials.dig(:quickbooks, credential_key).presence
        end

        def default_redirect_uri
          base_url = ENV["APP_BASE_URL"].presence || local_redirect_base_url
          return if base_url.blank?

          "#{base_url.delete_suffix('/')}/api/v1/integrations/quickbooks/callback"
        end

        def local_redirect_base_url
          return "http://localhost:3000" if Rails.env.development? || Rails.env.test?

          nil
        end
    end
  end
end
