# frozen_string_literal: true

# == Schema Information
#
# Table name: cli_sessions
#
#  id           :bigint           not null, primary key
#  expires_at   :datetime         not null
#  last_used_at :datetime
#  revoked_at   :datetime
#  token_digest :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_cli_sessions_on_company_id    (company_id)
#  index_cli_sessions_on_expires_at    (expires_at)
#  index_cli_sessions_on_token_digest  (token_digest) UNIQUE
#  index_cli_sessions_on_user_id       (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
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
      expires_at: SESSION_LIFETIME.from_now,
      last_used_at: Time.current
    )

    [session, plain_token]
  end

  def self.authenticate(plain_token)
    return if plain_token.blank?

    session = active.includes(:user, :company).find_by(token_digest: digest(plain_token))
    return unless session

    session.update_columns(last_used_at: Time.current, expires_at: SESSION_LIFETIME.from_now)
    session
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.digest(plain_token)
    Digest::SHA256.hexdigest(plain_token)
  end
end
