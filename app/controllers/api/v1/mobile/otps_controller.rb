# frozen_string_literal: true

class Api::V1::Mobile::OtpsController < Api::V1::ApplicationController
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
    user = result.user
    company = result.company
    sign_in user, store: false

    render json: {
      notice: I18n.t("devise.sessions.signed_in"),
      **mobile_signed_in_payload(user, company:)
    }, status: 200
  rescue MobileOtp::ChallengeToken::InvalidTokenError, KeyError
    render json: { error: "Invalid OTP" }, status: 422
  end

  private

    def otp_params
      params.permit(:phone, :company_id, :pending_token, :code)
    end
end
