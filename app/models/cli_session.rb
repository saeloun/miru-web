# frozen_string_literal: true

class CliSession < ApplicationRecord
  SESSION_LIFETIME = 7.days

  belongs_to :user
  belongs_to :company

  validates :token_digest, :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.issue_for(user:, company:)
    plain_token = SecureRandom.hex(32)
    session = create!(
      user: user,
      company: company,
      token_digest: digest(plain_token),
      auth_state_digest: auth_state_digest(user),
      expires_at: SESSION_LIFETIME.from_now,
      last_used_at: Time.current
    )

    [session, plain_token]
  end

  def self.authenticate(plain_token)
    return if plain_token.blank?

    session = active.includes(:user, :company).find_by(token_digest: digest(plain_token))
    return unless session

    unless session.user.kept? &&
        session.auth_state_digest == auth_state_digest(session.user) &&
        session.user.employments.kept.exists?(company_id: session.company_id) &&
        session.user.roles.exists?(resource: session.company)
      session.revoke!
      return
    end

    session.update_columns(last_used_at: Time.current, expires_at: SESSION_LIFETIME.from_now)
    session
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.digest(plain_token)
    Digest::SHA256.hexdigest(plain_token)
  end

  def self.auth_state_digest(user)
    digest([
      user.encrypted_password,
      user.otp_required_for_login?,
      user.passkey_required_for_login?
    ].join(":"))
  end
end
