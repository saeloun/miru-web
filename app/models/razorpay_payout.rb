# frozen_string_literal: true

class RazorpayPayout < ApplicationRecord
  ACTIVE_STATUSES = %w[pending processing queued processed].freeze

  enum :status, {
    pending: 0,
    processing: 1,
    queued: 2,
    processed: 3,
    failed: 4,
    reversed: 5,
    cancelled: 6
  }

  enum :triggered_by, {
    automatic: 0,
    manual: 1
  }

  belongs_to :payment
  belongs_to :requested_by, class_name: "User", optional: true
  has_one :invoice, through: :payment

  validates :amount, numericality: { greater_than: 0 }
  validates :currency, :reference_id, :idempotency_key, :mode, :recipient_upi_id, presence: true
  validates :external_id, uniqueness: true, allow_blank: true
  validates :idempotency_key, :reference_id, uniqueness: true

  scope :active, -> { where(status: ACTIVE_STATUSES) }

  def terminal?
    failed? || reversed? || cancelled? || processed?
  end
end
