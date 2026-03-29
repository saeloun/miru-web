# frozen_string_literal: true

class AgentKey < ApplicationRecord
  belongs_to :agent
  belongs_to :created_by, class_name: "User", optional: true

  validates :name, presence: true, length: { maximum: 80 }
  validates :token_digest, presence: true, uniqueness: true

  scope :active, -> { where(revoked_at: nil).joins(:agent).merge(Agent.active).includes(agent: [:company, :user]) }

  def self.issue_for(agent:, name:, created_by: nil)
    plain_token = SecureRandom.hex(32)
    key = create!(
      agent:,
      name:,
      created_by:,
      token_digest: digest(plain_token)
    )

    [key, plain_token]
  end

  def self.authenticate(plain_token)
    return if plain_token.blank?

    key = active.find_by(token_digest: digest(plain_token))
    return unless key&.agent&.backing_user_active_for_company?

    key.update_columns(last_used_at: Time.current)
    key
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.digest(plain_token)
    Digest::SHA256.hexdigest(plain_token)
  end
end
