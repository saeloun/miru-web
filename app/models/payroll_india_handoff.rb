# frozen_string_literal: true

class PayrollIndiaHandoff < ApplicationRecord
  FROZEN_FIELDS = %w[company_id payroll_run_id payroll_revision_id employment_id consultant_compensation_id created_by_id report line_digest bank_digest entitlement_minor].freeze
  self.filter_attributes += [:report, :bank_digest]
  serialize :report, coder: JSON, type: Hash
  encrypts :report
  attr_readonly(*FROZEN_FIELDS)

  belongs_to :company
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  belongs_to :consultant_compensation
  belongs_to :created_by, class_name: "User"
  has_many :payroll_india_deliveries, dependent: :restrict_with_exception
  has_many :payroll_india_credits, dependent: :restrict_with_exception

  validates :entitlement_minor, numericality: { only_integer: true, greater_than: 0 }
  validates :credited_minor, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :same_company, on: :create
  scope :active, -> { where(released_at: nil) }
  after_update_commit :enqueue_consultant_invoice, if: -> { saved_change_to_fully_credited_at? && fully_credited_at_before_last_save.nil? && fully_credited_at.present? }

  def status
    return "voided" if released_at
    return "credited" if fully_credited_at
    return "settlement_blocked" if settlement_blocked?
    return "partially_credited" if credited_minor.positive?

    state = payroll_india_deliveries.max_by(&:attempt_number)&.state
    state == "sent" ? "awaiting_payment" : state
  end

  def settlement_blocked?
    released_at.nil? && credited_minor >= entitlement_minor && fully_credited_at.nil?
  end

  def serializable_hash(options = nil)
    super.except("report", "bank_digest")
  end

  private

    def enqueue_consultant_invoice
      PayrollConsultantInvoiceIssueJob.enqueue_safely(payroll_run_id, employment_id)
    end

    def same_company
      Payroll::Entitlement.require!(company_id)
      return if payroll_run&.company_id == company_id && payroll_revision&.payroll_run_id == payroll_run_id &&
        employment&.company_id == company_id && consultant_compensation&.employment_id == employment_id

      errors.add(:base, "Handoff records must belong to one company and run")
    end
end
