# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    return handle_native_google_callback if session[:native_google_request].present?

    handle_oauth_callback(
      provider: Authentication::Google,
      kind: "Google",
      failure_message: "There was a problem signing you in through Google. Please register or try signing in later."
    )
  end

  def failure
    if session[:native_google_request].present?
      strategy = request.env["omniauth.error.strategy"]
      return head 400 unless strategy
      return handle_native_google_failure if strategy.name == "google_oauth2"
    end

    super
  end

  def github
    handle_oauth_callback(
      provider: Authentication::Github,
      kind: "GitHub",
      failure_message: "There was a problem signing you in through GitHub. Please register or try signing in later."
    )
  end

  protected

    def handle_native_google_callback
      token = session.delete(:native_google_request)
      binding = session.delete(:native_google_binding)
      record = NativeGoogleAuthRequest.find_request!(token)
      code = record.complete!(binding:) do
        NativeGoogleAuth::Account.new(request.env["omniauth.auth"], record).resolve!
      end
      native_google_redirect(record, token, code:)
    rescue NativeGoogleAuth::Account::Rejected => error
      reject_native_google_callback(record, token, binding, error.code)
    rescue NativeGoogleAuthRequest::InvalidHandoff
      redirect_to root_path, alert: "Google authentication expired. Please start again."
    end

    def reject_native_google_callback(record, token, binding, code)
      record.cancel!(binding:)
      native_google_redirect(record, token, error: code)
    rescue NativeGoogleAuthRequest::InvalidHandoff
      redirect_to root_path, alert: "Google authentication expired. Please start again."
    end

    def handle_native_google_failure
      token = session.delete(:native_google_request)
      binding = session.delete(:native_google_binding)
      record = NativeGoogleAuthRequest.find_request!(token)
      record.cancel!(binding:)
      native_google_redirect(record, token, error: "provider_error")
    rescue NativeGoogleAuthRequest::InvalidHandoff
      redirect_to root_path, alert: "Google authentication expired. Please start again."
    end

    def native_google_redirect(record, token, **outcome)
      response.headers["Cache-Control"] = "no-store"
      response.headers["Referrer-Policy"] = "no-referrer"
      query = URI.encode_www_form({ request_id: token, state: record.client_state }.merge(outcome))
      redirect_to "#{NativeGoogleAuthRequest::CALLBACK_URI}?#{query}", allow_other_host: true
    end

    def after_omniauth_failure_path_for(scope)
      root_path(scope)
    end

    def after_sign_in_path_for(resource)
      root_path(google_oauth_success: true)
    end

    def handle_oauth_callback(provider:, kind:, failure_message:)
      user = provider.new(request.env["omniauth.auth"]).user!

      if user&.persisted?
        if (error = SsoEnforcement.new(user).oauth_error)
          flash[:error] = error
          redirect_to root_path
          return
        end

        sign_in_and_redirect user
        set_flash_message(:notice, :success, kind:) if is_navigational_format?
      else
        flash[:error] = failure_message
        redirect_to root_path
      end
    end
end
