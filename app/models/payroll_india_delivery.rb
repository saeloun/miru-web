# frozen_string_literal: true

class PayrollIndiaDelivery < ApplicationRecord
  STATES = %w[queued sending sent failed uncertain].freeze
  self.filter_attributes += [:review_evidence]
  encrypts :review_evidence
  attr_readonly :payroll_india_handoff_id, :attempt_number
  belongs_to :payroll_india_handoff
  belongs_to :reviewed_by, class_name: "User", optional: true
  validates :state, inclusion: { in: STATES }
  validates :attempt_number, numericality: { only_integer: true, greater_than: 0 }
  after_create_commit { PayrollIndiaDeliveryJob.perform_later(id) }

  def serializable_hash(options = nil)
    super.except("review_evidence")
  end
end
