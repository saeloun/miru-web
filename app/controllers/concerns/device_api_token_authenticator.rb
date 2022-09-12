# frozen_string_literal: true

module DeviceApiTokenAuthenticator
  extend ActiveSupport::Concern
  include ActionController::HttpAuthentication::Token

  included do
    before_action :authenticate!
  end

  private

    def authenticate!
      authenticate(self) do |token, _options|
        # Compare the tokens in a time-constant manner, to mitigate
        # timing attacks.

        secret_key = Rails.application.credentials.device_api_secret_key
        if Rails.env.production?
          secret_key = Rails.application.credentials.production.device_api_secret_key
        end

        ActiveSupport::SecurityUtils.secure_compare(token, secret_key)
      end || authentication_request(self, "Application", nil)
    end
end
