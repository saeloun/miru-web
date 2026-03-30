# frozen_string_literal: true

class Api::V1::Users::SessionsController < Devise::SessionsController
  skip_before_action :verify_authenticity_token, only: :create
  include Authenticable
  include AuthResponsePayload
  include CurrentCompanyConcern

  before_action :authenticate_user_using_x_auth_token, only: :me

  respond_to :json

  def create
    user = User.find_for_database_authentication(email: user_params[:email])

    if invalid_password?(user)
      render_invalid_password_error
    elsif user.access_locked?
      render_invalid_password_error
    elsif !user.confirmed?
      render_unconfirmed_user_error(user)
    elsif passkey_login_unsupported?(user)
      render_passkey_unsupported_error
    elsif passkey_login_required?(user)
      render_passkey_challenge(user)
    elsif totp_login_unsupported?(user)
      render_totp_unsupported_error
    elsif totp_login_required?(user)
      render_totp_challenge(user)
    else
      handle_successful_sign_in(user)
    end
end

  def destroy
    sign_out(current_user)
    reset_session
    render json: { notice: I18n.t("devise.sessions.signed_out"), reset_session: true }, status: 200
  end

  def me
    if current_user
      render json: {
        user: safe_user_payload(current_user).merge(
          "date_of_birth" => current_user.date_of_birth,
          "phone" => current_user.phone,
          "personal_email_id" => current_user.personal_email_id,
          "social_accounts" => current_user.social_accounts,
          "date_format" => current_company&.date_format
        ),
        company_role: company_role_payload(current_user, current_company),
        company: company_payload(current_company)
      }, status: 200
    else
      render json: { error: "Not authenticated" }, status: 401
    end
  end

  private

    def user_params
      params.require(:user).permit(:email, :password)
    end

    def invalid_password?(user)
      return true if user.blank?

      !user.valid_for_authentication? { user.valid_password?(user_params[:password]) }
    end

    def render_invalid_password_error
      render json: { error: I18n.t("sessions.failure.invalid") }, status: 422
    end

    def render_unconfirmed_user_error(user)
      render json: {
        error: I18n.t("devise.failure.unconfirmed"),
        unconfirmed: !user.confirmed?
      }, status: 422
    end

    def render_passkey_unsupported_error
      render json: {
        error: "This account requires a passkey. Sign in from the web app to continue."
      }, status: 422
    end

    def render_totp_unsupported_error
      render json: {
        error: "This account requires an authenticator code. Sign in from the web app to continue."
      }, status: 422
    end

    def handle_successful_sign_in(user)
      user.reset_failed_attempts! if user.respond_to?(:reset_failed_attempts!)
      sign_in(user)

      app = params[:app] || ""

      if app == "miru-desktop"
        render_sign_in_response_for_desktop(user)
      elsif app == "miru-mobile"
        render_sign_in_response_for_mobile(user)
      elsif app == "miru-cli"
        render_sign_in_response_for_cli(user)
      else
        render_sign_in_response(user)
      end
    end

    def render_sign_in_response(user)
      render json: signed_in_payload(
        user,
        company: current_company,
        notice: I18n.t("devise.sessions.signed_in"),
        include_token: true
      ), status: 200
    end

    def render_passkey_challenge(user)
      options = ::WebAuthn::RelyingParty.new(
        allowed_origins: [request.base_url],
        id: request.host,
        name: "Miru"
      ).options_for_authentication(
        allow: user.passkeys.pluck(:external_id),
        user_verification: "preferred"
      )

      render json: {
        requires_passkey: true,
        public_key: options,
        pending_token: Passkeys::ChallengeToken.issue(
          "challenge" => options.challenge,
          "user_id" => user.id,
          "company_id" => current_company&.id,
          "type" => "authentication",
          "app" => params[:app].presence || "web"
        )
      }, status: 200
    end

    def render_totp_challenge(user)
      render json: {
        requires_totp: true,
        pending_token: Passkeys::ChallengeToken.issue(
          "user_id" => user.id,
          "company_id" => current_company&.id,
          "type" => "totp_authentication",
          "app" => params[:app].presence || "web"
        )
      }, status: 200
    end

    def render_sign_in_response_for_desktop(user)
      render json: {
        notice: I18n.t("devise.sessions.signed_in"),
        **desktop_signed_in_payload(
          user,
          company: current_company,
          google_oauth_success: @google_oauth_success.present?
        )
      }, status: 200
    end

    def render_sign_in_response_for_mobile(user)
      render json: {
        notice: I18n.t("devise.sessions.signed_in"),
        **mobile_signed_in_payload(user, company: current_company)
      }, status: 200
    end

    def render_sign_in_response_for_cli(user)
      cli_session, plain_token = CliSession.issue_for(user:, company: current_company)

      render json: {
        notice: I18n.t("devise.sessions.signed_in"),
        user: safe_user_payload(user),
        company: {
          id: current_company.id,
          name: current_company.name
        },
        cli_session: {
          token: plain_token,
          expires_at: cli_session.expires_at.iso8601
        }
      }, status: 200
    end

    def passkey_login_required?(user)
      user.passkey_required_for_login? && user.passkeys.exists? && params[:app].blank?
    end

    def passkey_login_unsupported?(user)
      user.passkey_required_for_login? && user.passkeys.exists? && params[:app].present?
    end

    def totp_login_required?(user)
      user.totp_enabled? && params[:app].blank?
    end

    def totp_login_unsupported?(user)
      user.totp_enabled? && params[:app].present?
    end
end
