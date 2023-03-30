# frozen_string_literal: true

module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_using_x_auth_token
  end

  private

    def authenticate_user_using_x_auth_token
      user_email = request.headers["X-Auth-Email"].presence
      auth_token = request.headers["X-Auth-Token"].presence
      user = user_email && User.find_by(email: user_email)

      if user && auth_token && Devise.secure_compare(user.token, auth_token)
        sign_in user, store: false
      else
        render json: { error: I18n.t("devise.failure.unauthenticated") }, status: :unauthorized
      end
    end
end
