# frozen_string_literal: true

require "omniauth"
require "action_controller"

module OmniAuth
  module RailsCsrfProtection
    class TokenVerifier
      class << self
        delegate :config, to: :'ActionController::Base'
      end

      include ActionController::RequestForgeryProtection

      config.each_key do |configuration_name|
        define_method(configuration_name) do
          self.class.config[configuration_name]
        end
      end

      def call(env)
        @request = ActionDispatch::Request.new(env.dup)

        raise ActionController::InvalidAuthenticityToken unless verified_request?
      end

      private

        attr_reader :request
        delegate :params, :session, to: :request
    end
  end
end

OmniAuth.config.request_validation_phase = OmniAuth::RailsCsrfProtection::TokenVerifier.new
