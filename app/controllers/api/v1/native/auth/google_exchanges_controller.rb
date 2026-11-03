# frozen_string_literal: true

class Api::V1::Native::Auth::GoogleExchangesController < ActionController::API
  include SameOriginAuthentication
  include AuthResponsePayload
  wrap_parameters false

  before_action :reject_cross_origin_authentication!
  before_action :prevent_caching
  rescue_from NativeGoogleAuthRequest::InvalidHandoff, with: :invalid_handoff
  rescue_from ActiveRecord::RecordNotFound, with: :invalid_handoff

  def create
    values = params.to_unsafe_h.except("controller", "action", "format")
    raise NativeGoogleAuthRequest::InvalidHandoff unless
      (values.keys - %w[request_id code code_verifier]).empty?

    record = NativeGoogleAuthRequest.find_request!(values["request_id"])
    payload = record.exchange!(code: values["code"], verifier: values["code_verifier"]) do |user|
      raise NativeGoogleAuthRequest::InvalidHandoff if SsoEnforcement.new(user).oauth_error

      case record.outcome
      when "signed_in"
        company = user.companies.merge(Employment.kept).find_by(id: record.company_id)
        raise NativeGoogleAuthRequest::InvalidHandoff unless company &&
          user.current_workspace_id == company.id && user.roles.exists?(resource: company) &&
          !NativeGoogleAuth::Account.requires_factor?(user)

        mobile_signed_in_payload(user, company:).merge(status: "signed_in")
      when "needs_workspace"
        { status: "needs_workspace", continuation_url: root_url(format: nil),
          notice: "Continue in Miru web to create or join a workspace." }
      when "additional_verification_required"
        { status: "additional_verification_required", continuation_url: root_url(format: nil),
          notice: "Sign in to Miru web with your configured verification method." }
      end
    end
    render json: payload, status: 200
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["Referrer-Policy"] = "no-referrer"
    end

    def invalid_handoff
      render json: { status: "failed", error: "invalid_handoff",
        notice: "Google authentication expired or could not be verified. Please start again." },
        status: 422
    end
end
