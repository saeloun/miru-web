# frozen_string_literal: true

class PayrollConsultantInvoiceDelivery < ApplicationRecord
  self.filter_attributes += [:review_evidence]
  belongs_to :payroll_consultant_invoice
  belongs_to :reviewed_by, class_name: "User", optional: true
  encrypts :review_evidence
  attr_readonly :payroll_consultant_invoice_id, :attempt_number
  validates :state, inclusion: { in: %w[queued sending sent failed uncertain] }
  validates :attempt_number, numericality: { only_integer: true, greater_than: 0 }

  def serializable_hash(options = nil)
    super.except("review_evidence")
  end
end
