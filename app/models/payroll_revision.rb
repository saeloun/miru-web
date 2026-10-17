# frozen_string_literal: true

class PayrollRevision < ApplicationRecord
  self.filter_attributes += [:payroll_payload]

  belongs_to :payroll_run
  belongs_to :created_by, class_name: "User"
  has_many :payroll_approvals, dependent: :restrict_with_exception
  before_validation :require_payroll_entitlement, on: :create

  validates :number, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :payroll_run_id }
  validates :idempotency_key, presence: true, length: { maximum: 128 }, uniqueness: { scope: :payroll_run_id }
  validates :digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validate :valid_snapshot, on: :create
  validate :valid_chain, on: :create

  def readonly?
    persisted?
  end

  def approval_issues
    Payroll::Snapshot.new(payroll_run, payroll_payload, actor_id: created_by_id).approval_issues
  end

  def self.chain_digest(snapshot_digest, parent_digest, number)
    Digest::SHA256.hexdigest(JSON.generate([snapshot_digest, parent_digest, number]))
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(payroll_run&.company_id)
    end

    def valid_snapshot
      return unless payroll_run

      snapshot = Payroll::Snapshot.new(payroll_run, payroll_payload, actor_id: created_by_id)
      errors.add(:payroll_payload, "has invalid structure or source references") unless snapshot.valid?
      expected = self.class.chain_digest(snapshot.digest, parent_digest, number)
      errors.add(:digest, "does not match snapshot") unless digest == expected
    end

    def valid_chain
      return unless payroll_run

      previous = payroll_run.current_revision
      errors.add(:parent_digest, "is stale") unless parent_digest == previous&.digest
      errors.add(:number, "must follow current revision") unless number == (previous&.number || 0) + 1
      errors.add(:created_by, "must be an active accounts reviewer") unless payroll_run.eligible_actor?(created_by, "accounts")
    end
end
