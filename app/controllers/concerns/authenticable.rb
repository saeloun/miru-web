# frozen_string_literal: true

module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_using_x_auth_token
    helper_method :current_cli_session
  end

  private

    def authenticate_user_using_x_auth_token
      # Skip if already authenticated via session cookie
      return if current_user

      return if authenticate_user_using_cli_token

      user_email = request.headers["X-Auth-Email"].presence
      auth_token = request.headers["X-Auth-Token"].presence
      user = user_email && User.find_by(email: user_email)

      if user && auth_token && Devise.secure_compare(user.token, auth_token)
        sign_in user, store: false
      else
        render json: { error: I18n.t("devise.failure.unauthenticated") }, status: 401
      end
    end

    def authenticate_user_using_cli_token
      authorization_header = request.headers["Authorization"].to_s
      cli_token = authorization_header.delete_prefix("Bearer ").presence
      session = CliSession.authenticate(cli_token)
      return false unless session

      @current_cli_session = session
      sign_in session.user, store: false
      true
    end

    def current_cli_session
      @current_cli_session
    end
end
