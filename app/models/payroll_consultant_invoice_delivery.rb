# frozen_string_literal: true

class PayrollConsultantInvoiceDelivery < ApplicationRecord
  self.filter_attributes += [:review_evidence, :claim_token]
  belongs_to :payroll_consultant_invoice
  belongs_to :reviewed_by, class_name: "User", optional: true
  encrypts :review_evidence
  attr_readonly :payroll_consultant_invoice_id, :attempt_number
  validates :state, inclusion: { in: %w[queued sending sent failed uncertain] }
  validates :attempt_number, numericality: { only_integer: true, greater_than: 0 }
  after_create_commit :enqueue_delivery, if: -> { state == "queued" }

  def serializable_hash(options = nil)
    super.except("review_evidence", "claim_token")
  end

  private

    def enqueue_delivery
      PayrollConsultantInvoiceDeliveryJob.enqueue_safely(id)
    end
end
