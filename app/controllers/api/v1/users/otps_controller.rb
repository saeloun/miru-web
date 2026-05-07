# frozen_string_literal: true

class Api::V1::Users::OtpsController < Api::V1::ApplicationController
  include AuthResponsePayload

  skip_before_action :authenticate_user!
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :set_virtual_verified_invitations_allowed

  def create
    skip_authorization

    result = MobileOtp::LoginChallenge.request(
      phone: otp_params[:phone],
      company_id: otp_params[:company_id]
    )

    render json: result.body, status: result.status
  end

  def verify
    skip_authorization

    result = MobileOtp::LoginChallenge.verify(
      pending_token: otp_params[:pending_token],
      code: otp_params[:code]
    )
    sign_in(result.user)

    render json: signed_in_payload(
      result.user,
      company: result.company,
      notice: I18n.t("devise.sessions.signed_in"),
      include_token: true
    ), status: 200
  rescue MobileOtp::ChallengeToken::InvalidTokenError, KeyError
    render json: { error: "OTP expired or invalid. Request a new code." }, status: 422
  end

  private

    def otp_params
      params.permit(:phone, :company_id, :pending_token, :code)
    end
end
