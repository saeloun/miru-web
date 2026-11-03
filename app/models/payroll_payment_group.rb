# frozen_string_literal: true

class PayrollPaymentGroup < ApplicationRecord
  RESOLVED_CREDIT_STATES = %w[credited shortfall_resolved].freeze

  belongs_to :company
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  belongs_to :split_arrangement, class_name: "PayrollSplitArrangement", optional: true
  has_many :payroll_payment_instructions, dependent: :restrict_with_exception

  before_validation :require_payroll_entitlement

  validates :entitlement_minor, numericality: { only_integer: true, greater_than: 0 }
  validates :required_legs, inclusion: { in: [1, 2] }
  validates :line_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :employment_id, uniqueness: { scope: :payroll_run_id }

  def self.line_digest(line)
    Digest::SHA256.hexdigest(JSON.generate(
      [line["currency"], line["amounts"].sort.to_h, line["reimbursements"].pluck("source_reference").sort,
       line["extras"].pluck("code", "amount_minor").sort, line["deductions"].pluck("code", "amount_minor").sort]
    ))
  end

  def open_legs
    payroll_payment_instructions.open_slot
  end

  def in_flight_legs
    open_legs.where.not(submission_state: "prepared")
  end

  def fully_credited?
    legs = open_legs.to_a
    legs.size == required_legs && legs.all? do |leg|
      RESOLVED_CREDIT_STATES.include?(leg.credit_state) && leg.held_reason.blank? &&
        PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.exclude?(leg.transaction_status)
    end
  end

  def can_complete?
    return false if fully_credited_at

    legs = open_legs.to_a
    legs.any? { |leg| leg.submission_state != "prepared" } && legs.none?(&:held?)
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end
end
