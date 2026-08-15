# frozen_string_literal: true

module SsoEnforcementConcern
  extend ActiveSupport::Concern

  private

    def sso_sign_in_error(user)
      return if user.nil?

      SsoEnforcement.new(user).password_error
    end

    def sso_sign_in_allowed?(user)
      error = sso_sign_in_error(user)
      return true unless error

      render_sso_sign_in_error(error)
      false
    end

    def render_sso_sign_in_error(error)
      render json: { error: }, status: 403
    end
end
