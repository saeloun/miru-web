# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  include SecondFactorAuthentication

  def google_oauth2
    handle_oauth_callback(
      provider: Authentication::Google,
      kind: "Google",
      failure_message: "There was a problem signing you in through Google. Please register or try signing in later."
    )
  end

  def github
    handle_oauth_callback(
      provider: Authentication::Github,
      kind: "GitHub",
      failure_message: "There was a problem signing you in through GitHub. Please register or try signing in later."
    )
  end

  protected

    def after_omniauth_failure_path_for(scope)
      root_path(scope)
    end

    def after_sign_in_path_for(resource)
      root_path(google_oauth_success: true)
    end

    def handle_oauth_callback(provider:, kind:, failure_message:)
      user = provider.new(request.env["omniauth.auth"]).user!

      if user&.persisted?
        unless user.active_for_authentication? && user.confirmed? && !user.access_locked?
          flash[:error] = I18n.t("devise.failure.unauthenticated")
          redirect_to root_path
          return
        end

        if (error = SsoEnforcement.new(user).oauth_error)
          flash[:error] = error
          redirect_to root_path
          return
        end

        if second_factor_required?(user) && !trusted_browser?(user)
          session[:pending_second_factor] = second_factor_challenge_payload(user, sso_authenticated: true)
          redirect_to "/login?verify=1"
          return
        end

        sign_in_and_redirect user
        Rails.event.notify(Users::SignedIn.new(user, sign_in_method: kind.downcase))
        set_flash_message(:notice, :success, kind:) if is_navigational_format?
      else
        flash[:error] = failure_message
        redirect_to root_path
      end
    end
end
