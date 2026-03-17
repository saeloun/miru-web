# frozen_string_literal: true

class Api::V1::Users::PasskeysController < Api::V1::ApplicationController
  skip_before_action :authenticate_user!, only: :authenticate
  skip_before_action :authenticate_user_using_x_auth_token, only: :authenticate
  skip_before_action :set_virtual_verified_invitations_allowed, only: :authenticate

  rescue_from Passkeys::ChallengeToken::InvalidTokenError, with: :render_invalid_passkey_token
  rescue_from ::WebAuthn::Error, with: :render_invalid_passkey_response
  rescue_from ActiveRecord::RecordNotFound, with: :render_missing_passkey

  def index
    authorize current_user, policy_class: PasskeyPolicy
    render_passkeys
  end

  def registration_options
    authorize current_user, policy_class: PasskeyPolicy
    current_user.ensure_webauthn_id!

    options = relying_party.options_for_registration(
    user: {
      id: current_user.webauthn_id,
      name: current_user.email,
      display_name: current_user.full_name
    },
    exclude: current_user.passkeys.pluck(:external_id),
    authenticator_selection: {
      resident_key: "preferred",
      user_verification: "preferred"
    }
  )

    render json: {
      public_key: options,
      challenge_token: Passkeys::ChallengeToken.issue(
        "challenge" => options.challenge,
        "user_id" => current_user.id,
        "type" => "registration"
      )
    }, status: 200
  end

  def create
    authorize current_user, policy_class: PasskeyPolicy
    payload = Passkeys::ChallengeToken.verify(passkey_params[:challenge_token])
    raise Passkeys::ChallengeToken::InvalidTokenError unless payload["type"] == "registration"
    raise ActiveRecord::RecordNotFound unless payload["user_id"].to_i == current_user.id

    credential = relying_party.verify_registration(
      passkey_params[:credential].to_h,
      payload["challenge"]
    )

    current_user.passkeys.create!(
      external_id: credential.id,
      public_key: credential.public_key,
      sign_count: credential.sign_count,
      nickname: passkey_params[:nickname].presence || default_nickname
    )

    render_passkeys(status: :created, notice: "Passkey added")
  end

  def authenticate
    skip_authorization
    payload = Passkeys::ChallengeToken.verify(authentication_params[:pending_token])
    raise Passkeys::ChallengeToken::InvalidTokenError unless payload["type"] == "authentication"

    user = User.find(payload["user_id"])
    credential, passkey = relying_party.verify_authentication(
      authentication_params[:credential].to_h,
      payload["challenge"],
      public_key: nil,
      sign_count: nil
    ) do |webauthn_credential|
      user.passkeys.find_by!(external_id: webauthn_credential.id)
    end

    passkey.update!(sign_count: credential.sign_count, last_used_at: Time.current)
    sign_in(user)

    render json: {
      notice: I18n.t("devise.sessions.signed_in"),
      user: safe_user_payload(user).merge(token: user.token),
      company_role: user.roles.find_by(resource: current_company)&.name,
      company: company_payload(current_company)
    }, status: 200
  end

  def update_requirement
    authorize current_user, policy_class: PasskeyPolicy
    required = ActiveModel::Type::Boolean.new.cast(requirement_params[:required])

    if required && current_user.passkeys.none?
      render json: { error: "Add a passkey before requiring it for sign in." }, status: 422
      return
    end

    current_user.update!(passkey_required_for_login: required)
    render_passkeys(notice: required ? "Passkey requirement enabled" : "Passkey requirement disabled")
  end

  def destroy
    authorize current_user, policy_class: PasskeyPolicy
    passkey = current_user.passkeys.find(params[:id])
    passkey.destroy!

    if current_user.passkeys.none? && current_user.passkey_required_for_login?
      current_user.update!(passkey_required_for_login: false)
    end

    render_passkeys(notice: "Passkey removed")
  end

  private

    def passkey_params
      params.permit(:challenge_token, :nickname, credential: {})
    end

    def authentication_params
      params.permit(:pending_token, credential: {})
    end

    def requirement_params
      params.permit(:required)
    end

    def render_passkeys(status: :ok, notice: nil)
      render json: {
        notice:,
        passkeys: current_user.passkeys.order(created_at: :desc).map { |passkey| serialize_passkey(passkey) },
        passkey_required_for_login: current_user.passkey_required_for_login?
      }.compact, status: status
    end

    def serialize_passkey(passkey)
      {
        id: passkey.id,
        nickname: passkey.nickname,
        created_at: passkey.created_at,
        last_used_at: passkey.last_used_at
      }
    end

    def safe_user_payload(user)
      user.as_json(only: [:id, :email, :first_name, :last_name, :current_workspace_id])
    end

    def company_payload(company)
      return nil unless company

      company.attributes.slice(
        "id",
        "name",
        "base_currency",
        "fiscal_year_end",
        "date_format",
        "business_phone",
        "tax_id",
        "plan_tier"
      ).merge(
        "pro_access" => company.pro_access?,
        "current_plan_label" => company.current_plan_label,
        "team_member_limit" => company.team_member_limit,
        "used_team_seats" => company.used_team_seats,
        "reserved_team_seats" => company.reserved_team_seats,
        "team_member_limit_reached" => company.team_member_limit_reached?
      )
    end

    def default_nickname
      return request.user_agent.to_s.truncate(80) if request.user_agent.present?

      "Passkey"
    end

    def relying_party
      @relying_party ||= ::WebAuthn::RelyingParty.new(
        allowed_origins: [request.base_url],
        id: request.host,
        name: "Miru"
      )
    end

    def render_invalid_passkey_token
      render json: { error: "Passkey session expired. Please try again." }, status: 422
    end

    def render_invalid_passkey_response(error)
      render json: { error: error.message.presence || "Passkey verification failed." }, status: 422
    end

    def render_missing_passkey
      render json: { error: "Passkey not found." }, status: 404
    end
end
