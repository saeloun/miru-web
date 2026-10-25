# frozen_string_literal: true

class HiringMailbox < ApplicationRecord
  belongs_to :company
  has_many :hiring_receipts, dependent: :restrict_with_exception
  attribute :routing_key, default: -> { SecureRandom.uuid }
  attr_readonly :company_id, :routing_key
  self.filter_attributes += [:source_email]
  audited associated_with: :company, on: :update, only: [:name, :active]

  normalizes :source_email, with: ->(value) { value.strip.downcase }
  normalizes :name, with: ->(value) { value.strip }
  validates :name, presence: true, length: { maximum: 200 }, format: { without: /[[:cntrl:]]/ }
  validates :source_email, presence: true, length: { maximum: 254 }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :active, inclusion: { in: [true, false] }
end
