# frozen_string_literal: true

class DesktopCurrentTimer < ApplicationRecord
  belongs_to :company
  belongs_to :user

  validates :current_timer, presence: true
  validates :user_id, uniqueness: { scope: :company_id }
end
