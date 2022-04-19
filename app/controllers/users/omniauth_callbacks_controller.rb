# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    user = Authentication::Google.new(request.env["omniauth.auth"]).user!
    if user&.persisted?
      sign_in_and_redirect user
      set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
    else
      flash[:error] = "There was a problem signing you in through Google. Please register or try signing in later."
      redirect_to new_user_registration_url
    end
  end
end
