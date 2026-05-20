# frozen_string_literal: true

class Api::V1::Users::TotpController < Api::V1::ApplicationController
  include AuthResponsePayload

  skip_before_action :authenticate_user!, only: :authenticate

  rescue_from Passkeys::ChallengeToken::InvalidTokenError, with: :render_invalid_token

  def show
    authorize current_user, policy_class: TotpPolicy
    render_state
  end

  def setup
    authorize current_user, policy_class: TotpPolicy

    if current_user.passkey_required_for_login?
      render json: { error: I18n.t("totp.disable_passkey_first") }, status: 422
      return
    end

    current_user.reset_totp_setup!

    render json: totp_state.merge(
      secret: current_user.otp_secret,
      provisioning_uri: current_user.totp_provisioning_uri
    ), status: 200
  end

  def confirm
    authorize current_user, policy_class: TotpPolicy

    unless current_user.verify_totp_code!(params[:code])
      render json: { error: I18n.t("totp.invalid_code") }, status: 422
      return
    end

    recovery_codes = current_user.generate_recovery_codes!
    current_user.update!(otp_required_for_login: true)

    render json: totp_state.merge(
      notice: I18n.t("totp.enabled"),
      recovery_codes:
    ), status: 200
  end

  def regenerate_recovery_codes
    authorize current_user, policy_class: TotpPolicy

    unless current_user.totp_enabled?
      render json: { error: I18n.t("totp.not_enabled") }, status: 422
      return
    end

    recovery_codes = current_user.generate_recovery_codes!

    render json: totp_state.merge(
      notice: I18n.t("totp.recovery_codes_regenerated"),
      recovery_codes:
    ), status: 200
  end

  def destroy
    authorize current_user, policy_class: TotpPolicy
    current_user.clear_totp!
    render json: totp_state.merge(notice: I18n.t("totp.disabled")), status: 200
  end

  def authenticate
    skip_authorization
    payload = Passkeys::ChallengeToken.verify(params[:pending_token])
    raise Passkeys::ChallengeToken::InvalidTokenError unless payload["type"] == "totp_authentication"

    user = User.find(payload["user_id"])
    company = Company.find_by(id: payload["company_id"]) || user.current_workspace

    unless valid_second_factor?(user)
      render json: { error: I18n.t("totp.invalid_verification") }, status: 422
      return
    end

    sign_in(user)

    render json: signed_in_payload(
      user,
      company:,
      notice: I18n.t("devise.sessions.signed_in"),
      include_token: false
    ), status: 200
  end

  private

    def render_state(status: :ok)
      render json: totp_state, status:
    end

    def totp_state
      {
        enabled: current_user.totp_enabled?,
        recovery_codes_count: Array(current_user.otp_recovery_codes_digest).size,
        recovery_codes_generated_at: current_user.otp_recovery_codes_generated_at
      }
    end

    def valid_second_factor?(user)
      user.verify_totp_code!(params[:code]) || user.consume_recovery_code!(params[:recovery_code])
    end

    def render_invalid_token
      render json: { error: I18n.t("totp.session_expired") }, status: 422
    end
end
