# frozen_string_literal: true

class PreviousEmployment < ApplicationRecord
  belongs_to :user

  validates :company_name, :role, length: { maximum: 50 }
  validates :company_name, :role, presence: true
end
