# frozen_string_literal: true

class Passkey < ApplicationRecord
  belongs_to :user

  validates :external_id, presence: true, uniqueness: true
  validates :public_key, presence: true
  validates :sign_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :nickname, length: { maximum: 80 }, allow_blank: true
end
