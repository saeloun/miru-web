# frozen_string_literal: true

module SecondFactorAuthentication
  extend ActiveSupport::Concern

  included do
    include ActionController::Cookies
    before_action { response.cache_control[:no_store] = true }
  end

  TRUST_DURATION = 30.days
  TRUST_COOKIE = :miru_trusted_browser

  private

    def second_factor_required?(user)
      user.totp_enabled? || (user.passkey_required_for_login? && user.passkeys.exists?)
    end

    def second_factor_challenge_payload(user, company: nil, sso_authenticated: false)
      company ||= user.current_workspace || user.companies.with_kept_employments.first
      passkey_required = user.passkey_required_for_login? && user.passkeys.exists?
      options = if passkey_required
        ::WebAuthn::RelyingParty.new(
          allowed_origins: [request.base_url], id: request.host, name: "Miru"
        ).options_for_authentication(allow: user.passkeys.pluck(:external_id), user_verification: "required")
      end

      {
        requires_passkey: passkey_required,
        requires_totp: user.totp_enabled?,
        public_key: options,
        pending_token: issue_second_factor_token(user,
          "user_id" => user.id,
          "company_id" => company&.id,
          "type" => passkey_required ? "authentication" : "totp_authentication",
          "totp_allowed" => user.totp_enabled?,
          "challenge" => options&.challenge,
          "sso_authenticated" => sso_authenticated)
      }
    end

    def second_factor_sign_in_allowed?(user, payload)
      return sso_sign_in_allowed?(user) unless payload["sso_authenticated"]

      error = SsoEnforcement.new(user).oauth_error
      return true unless error

      render_sso_sign_in_error(error)
      false
    end

    def issue_second_factor_token(user, payload)
      user.second_factor_challenges.where(expires_at: ..Time.current).delete_all
      challenge = user.second_factor_challenges.create!(expires_at: Passkeys::ChallengeToken::TTL.from_now)
      session[:second_factor_nonce] = SecureRandom.hex(32)

      Passkeys::ChallengeToken.issue(payload.merge(
        "login_challenge_id" => challenge.id,
        "browser_nonce" => session[:second_factor_nonce],
        "security_digest" => security_digest(user)
      ))
    end

    def validate_pending_login!(user, payload)
      challenge = user.second_factor_challenges.find_by(id: payload["login_challenge_id"])
      valid = challenge && challenge.expires_at > Time.current &&
        session[:second_factor_nonce].present? &&
        ActiveSupport::SecurityUtils.secure_compare(session[:second_factor_nonce], payload["browser_nonce"].to_s) &&
        payload["security_digest"] == security_digest(user) &&
        user.active_for_authentication? && user.confirmed? && !user.access_locked?
      raise Passkeys::ChallengeToken::InvalidTokenError unless valid
    end

    def complete_second_factor_sign_in(user, payload)
      user.second_factor_challenges.find(payload["login_challenge_id"]).destroy!
      user.reset_failed_attempts!
      reset_session
      sign_in(user)
      return unless ActiveModel::Type::Boolean.new.cast(params[:trust_browser])

      expires_at = TRUST_DURATION.from_now
      cookies.encrypted[TRUST_COOKIE] = {
        value: {
          user_id: user.id,
          security_digest: security_digest(user),
          expires_at: expires_at.to_i
        },
        expires: expires_at,
        httponly: true,
        secure: request.ssl?,
        same_site: :lax
      }
    end

    def trusted_browser?(user)
      trust = cookies.encrypted[TRUST_COOKIE]
      trust.is_a?(Hash) && trust["user_id"] == user.id &&
        trust["security_digest"] == security_digest(user) &&
        trust["expires_at"].to_i > Time.current.to_i
    end

    def security_digest(user)
      Digest::SHA256.hexdigest("#{user.token}:#{user.browser_trust_version}")
    end
end
