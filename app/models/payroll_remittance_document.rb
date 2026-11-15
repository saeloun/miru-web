# frozen_string_literal: true

class PayrollRemittanceDocument < ApplicationRecord
  KINDS = %w[firc fira inward_remittance_advice].freeze
  self.filter_attributes += [:details, :command_digest, :idempotency_key]
  belongs_to :company
  belongs_to :payroll_payment_instruction
  belongs_to :uploader, class_name: "User"
  belongs_to :previous_document, class_name: name, optional: true
  belongs_to :blob, class_name: "ActiveStorage::Blob"
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  scope :heads, -> { where.not(id: select(:previous_document_id).where.not(previous_document_id: nil)) }

  def readonly?
    persisted?
  end
end
