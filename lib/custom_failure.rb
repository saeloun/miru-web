# frozen_string_literal: true

# Override Devise::FailureApp
class CustomFailure < Devise::FailureApp
  def redirect_url
    if warden_message == :unconfirmed
      email = params[:user][:email]
      puts email
      false
    else
      super
    end
  end

  def respond
    if http_auth?
      http_auth
    else
      redirect
    end
  end
end
