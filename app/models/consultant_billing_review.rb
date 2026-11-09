# frozen_string_literal: true

class ConsultantBillingReview < ApplicationRecord
  self.filter_attributes += [:reason, :command_digest, :idempotency_key]
  belongs_to :company
  belongs_to :employment
  belongs_to :submission, class_name: "ConsultantBillingSubmission"
  belongs_to :actor, class_name: "User"
  belongs_to :previous_review, class_name: name, optional: true
  encrypts :reason
  scope :heads, -> { where.not(id: where.not(previous_review_id: nil).select(:previous_review_id)) }

  def readonly?
    persisted?
  end
end
