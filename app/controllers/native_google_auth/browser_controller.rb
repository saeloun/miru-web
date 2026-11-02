# frozen_string_literal: true

class NativeGoogleAuth::BrowserController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :prevent_caching
  rescue_from NativeGoogleAuthRequest::InvalidHandoff, with: :invalid_request

  def show
    record = NativeGoogleAuthRequest.find_request!(params[:request_id])
    binding = SecureRandom.hex(32)
    record.bind_browser!(binding)
    session[:native_google_request] = params[:request_id]
    session[:native_google_binding] = binding
    render "native_google_auth/browser/show", layout: false
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["Referrer-Policy"] = "no-referrer"
    end

    def invalid_request
      render plain: "This Google sign-in request expired. Return to Miru and start again.", status: 410
    end
end
