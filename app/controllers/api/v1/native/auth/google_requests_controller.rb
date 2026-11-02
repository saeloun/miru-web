# frozen_string_literal: true

class Api::V1::Native::Auth::GoogleRequestsController < ActionController::API
  include SameOriginAuthentication
  wrap_parameters false

  ALLOWED_PARAMS = %w[platform intent code_challenge_method code_challenge state invitation_token].freeze

  before_action :reject_cross_origin_authentication!
  before_action :prevent_caching
  rescue_from NativeGoogleAuthRequest::InvalidHandoff, with: :invalid_request

  def create
    values = params.to_unsafe_h.except("controller", "action", "format")
    raise NativeGoogleAuthRequest::InvalidHandoff unless (values.keys - ALLOWED_PARAMS).empty? &&
      values["platform"] == "ios" && values["code_challenge_method"] == "S256"

    invitation = nil
    if values["invitation_token"].present?
      raise NativeGoogleAuthRequest::InvalidHandoff unless values["invitation_token"].is_a?(String) &&
        values["invitation_token"].length.between?(1, 300)

      invitation = Invitation.find_by(token: values["invitation_token"])
      return render_failure("invitation_unavailable") unless invitation&.is_valid?
    end
    record, token = NativeGoogleAuthRequest.issue!(intent: values["intent"],
      code_challenge: values["code_challenge"], state: values["state"], invitation:)
    render json: { request_id: token,
      authorization_url: native_google_authorization_url(request_id: token, format: nil),
      expires_at: record.expires_at.iso8601 }, status: 201
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["Referrer-Policy"] = "no-referrer"
    end

    def invalid_request
      render_failure("invalid_request")
    end

    def render_failure(code)
      render json: { status: "failed", error: code,
        notice: "Unable to start Google authentication. Please try again." }, status: 422
    end
end
