# frozen_string_literal: true

class PayrollInvoicePreparation < ApplicationRecord
  OPERATIONAL_FIELDS = %w[state claim_token error_code started_at next_attempt_at updated_at].freeze
  self.filter_attributes += [:facts, :command_digest, :idempotency_key, :claim_token]
  belongs_to :company
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  belongs_to :actor, class_name: "User"
  belongs_to :previous_preparation, class_name: name, optional: true
  belongs_to :original_blob, class_name: "ActiveStorage::Blob", optional: true
  serialize :facts, coder: JSON, type: Hash
  encrypts :facts
  scope :heads, -> { where.not(id: where.not(previous_preparation_id: nil).select(:previous_preparation_id)) }
  before_update do
    raise ActiveRecord::ReadOnlyRecord, "Reviewed preparation is immutable" if (changed - OPERATIONAL_FIELDS).any?
  end
  before_destroy { raise ActiveRecord::ReadOnlyRecord, "Invoice preparation is retained" }
  after_create_commit :enqueue_consultant_invoice, if: :reviewed?

  def accounts_email
    facts["accounts_email"].presence || Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL
  end

  def serializable_hash(options = nil)
    super.except("facts", "command_digest", "idempotency_key", "claim_token")
  end

  private

    def enqueue_consultant_invoice
      PayrollConsultantInvoiceIssueJob.enqueue_safely(payroll_run_id, employment_id)
    end
end
