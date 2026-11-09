# frozen_string_literal: true

class ConsultantServiceFeeReview < ApplicationRecord
  self.filter_attributes += [:reason, :context]
  belongs_to :company
  belongs_to :employment
  belongs_to :actor, class_name: "User"
  belongs_to :previous_review, class_name: name, optional: true
  validates :reason, presence: true, length: { maximum: 1000 }
  validates :source_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :idempotency_key, presence: true, length: { maximum: 128 }
  validates :amount_minor, numericality: { only_integer: true, greater_than: 0, less_than: 100_000_000_000_000 }
  scope :heads, -> { where.not(id: ConsultantServiceFeeReview.where.not(previous_review_id: nil).select(:previous_review_id)) }

  def readonly?
    persisted?
  end
end
