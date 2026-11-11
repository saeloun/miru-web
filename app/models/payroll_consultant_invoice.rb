# frozen_string_literal: true

class PayrollConsultantInvoice < ApplicationRecord
  self.filter_attributes += [:snapshot, :number_digest]
  belongs_to :company
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  belongs_to :preparation, class_name: "PayrollInvoicePreparation"
  belongs_to :issuer, class_name: "User"
  belongs_to :authorization, class_name: "ConsultantInvoiceAuthorization", optional: true
  belongs_to :payroll_payment_group, optional: true
  belongs_to :payroll_india_handoff, optional: true
  belongs_to :pdf_blob, class_name: "ActiveStorage::Blob"
  belongs_to :original_blob, class_name: "ActiveStorage::Blob", optional: true
  has_many :payroll_consultant_invoice_deliveries, dependent: :restrict_with_exception
  serialize :snapshot, coder: JSON, type: Hash
  encrypts :snapshot

  def readonly?
    persisted?
  end

  def serializable_hash(options = nil)
    super.except("snapshot", "number_digest")
  end
end
