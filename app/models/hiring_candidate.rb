# frozen_string_literal: true

class HiringCandidate < ApplicationRecord
  belongs_to :company
  has_many :hiring_applications, dependent: :restrict_with_exception
  self.filter_attributes += [:full_name, :email]

  normalizes :email, with: ->(value) { value.strip.downcase }
  normalizes :full_name, with: ->(value) { value.strip }
  validates :full_name, presence: true, length: { maximum: 200 }, format: { without: /[[:cntrl:]]/ }
  validates :email, presence: true, length: { maximum: 254 }, format: { with: URI::MailTo::EMAIL_REGEXP }
end
