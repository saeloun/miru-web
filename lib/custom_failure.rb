# frozen_string_literal: true

# Override Devise::FailureApp
class CustomFailure < Devise::FailureApp
  def redirect_url
    if warden_message == :unconfirmed
      email = params[:user][:email]
      email_confirmation_path({ email: })
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
