# frozen_string_literal: true

class Passkey < ApplicationRecord
  belongs_to :user

  after_create :revoke_browser_trust
  after_destroy :revoke_browser_trust

  validates :external_id, presence: true, uniqueness: true
  validates :public_key, presence: true
  validates :sign_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :nickname, length: { maximum: 80 }, allow_blank: true

  private

    def revoke_browser_trust
      user.increment!(:browser_trust_version)
    end
end
