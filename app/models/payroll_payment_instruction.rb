# frozen_string_literal: true

class PayrollPaymentInstruction < ApplicationRecord
  FROZEN_FIELDS = %w[
    company_id payroll_payment_group_id payroll_run_id payroll_revision_id employment_id consultant_compensation_id recipient_link_id
    beneficiary connection_version environment source_account_id revision_digest bank_details_digest recipient_digest
    mercury_recipient_id entitlement_minor entitlement_currency reference_rate buffered_rate rate_source rate_mode rate_entered_by_id
    rate_observed_at rate_valid_until principal_minor fee_minor company_debit_minor charge_type purpose_category purpose_info idempotency_key
  ].freeze
  SUBMISSION_STATES = %w[prepared submitting accepted uncertain rejected voided].freeze
  REQUEST_STATUSES = %w[pendingApproval approved rejected cancelled].freeze
  TRANSACTION_STATUSES = %w[pending sent cancelled failed reversed blocked].freeze
  LINK_STATES = %w[none linked reconciliation_required].freeze
  CREDIT_STATES = %w[none partial credited shortfall_resolved].freeze
  NO_FUNDS_MOVED_TRANSACTIONS = %w[cancelled failed].freeze
  CREDIT_BARRED_TRANSACTIONS = %w[cancelled failed reversed blocked].freeze
  MAX_PRINCIPAL_MINOR = 1_000_000_000
  PURPOSE_CATEGORY = "contractor"
  CHARGE_TYPE = "ours"

  self.filter_attributes += [:idempotency_key, :purpose_info, :bank_details_digest, :recipient_digest]
  attr_readonly(*FROZEN_FIELDS)

  belongs_to :company
  belongs_to :payroll_payment_group
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  belongs_to :consultant_compensation
  belongs_to :recipient_link, class_name: "PayrollMercuryRecipientLink"
  belongs_to :prepared_by, class_name: "User"
  belongs_to :rate_entered_by, class_name: "User", optional: true
  belongs_to :submitted_by, class_name: "User", optional: true
  belongs_to :absent_confirmed_by, class_name: "User", optional: true
  has_many :payroll_payment_events, dependent: :restrict_with_exception

  before_validation :require_payroll_entitlement
  before_validation :freeze_digest, on: :create

  validates :beneficiary, inclusion: { in: PayrollMercuryRecipientLink::BENEFICIARIES }
  validates :submission_state, inclusion: { in: SUBMISSION_STATES }
  validates :request_status, inclusion: { in: REQUEST_STATUSES }, allow_nil: true
  validates :transaction_status, inclusion: { in: TRANSACTION_STATUSES }, allow_nil: true
  validates :transaction_link_state, inclusion: { in: LINK_STATES }
  validates :credit_state, inclusion: { in: CREDIT_STATES }
  validates :principal_minor, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_PRINCIPAL_MINOR }
  validates :fee_minor, numericality: { only_integer: true, greater_than: 0 }
  validates :entitlement_minor, numericality: { only_integer: true, greater_than: 0 }
  validates :entitlement_currency, inclusion: { in: %w[INR] }
  validates :charge_type, inclusion: { in: [CHARGE_TYPE] }
  validates :idempotency_key, presence: true, length: { maximum: 128 }
  validate :same_company, on: :create

  scope :open_slot, -> { where(released_at: nil) }

  def computed_digest
    values = FROZEN_FIELDS.index_with { |field| canonical_value(self[field]) }
    Digest::SHA256.hexdigest(JSON.generate(values))
  end

  def intact?
    computed_digest == frozen_digest
  end

  def provider_body
    {
      "recipientId" => mercury_recipient_id, "paymentMethod" => "internationalWire", "idempotencyKey" => idempotency_key,
      "purpose" => { "simple" => { "category" => purpose_category, "additionalInfo" => purpose_info } },
      "chargeType" => charge_type, "note" => idempotency_key
    }
  end

  def matches_request?(parsed)
    parsed.account_id == source_account_id && parsed.recipient_id == mercury_recipient_id &&
      parsed.payment_method == "internationalWire" && parsed.amount_minor == principal_minor
  end

  def shortfall_minor
    [entitlement_minor - credited_minor, 0].max
  end

  def stuck_submission?
    submission_state == "uncertain" || submission_state == "submitting"
  end

  def retry_unlocked?
    submission_state == "uncertain" && absent_confirmed_at.present?
  end

  def credit_recordable?
    return false unless submission_state == "accepted" && released_at.nil? && %w[none partial].include?(credit_state)
    return false if CREDIT_BARRED_TRANSACTIONS.include?(transaction_status) || request_status != "approved"

    transaction_link_state == "reconciliation_required" || transaction_status == "sent"
  end

  def display_state
    case submission_state
    when "prepared" then "ready_for_submission"
    when "submitting", "uncertain" then "submission_uncertain"
    when "rejected" then "submission_rejected"
    when "voided" then "voided"
    else accepted_display_state
    end
  end

  private

    def accepted_display_state
      barred = { "reversed" => "returned", "failed" => "transaction_failed", "cancelled" => "transaction_cancelled",
                 "blocked" => "transaction_blocked" }[transaction_status]
      return barred if barred

      reconciling = transaction_link_state == "reconciliation_required"
      return "credited_unlinked" if reconciling && %w[credited shortfall_resolved].include?(credit_state)

      credit_display_state || (reconciling ? "reconciliation_required" : request_display_state)
    end

    def credit_display_state
      { "partial" => "partially_credited", "credited" => "credited", "shortfall_resolved" => "credited_shortfall_resolved" }[credit_state]
    end

    def request_display_state
      case request_status
      when "pendingApproval" then "awaiting_mercury_approval"
      when "rejected" then "bank_rejected"
      when "cancelled" then "bank_cancelled"
      else { "pending" => "processing", "sent" => "sent_awaiting_credit" }.fetch(transaction_status, "bank_approved_awaiting_transaction")
      end
    end

    def canonical_value(value)
      case value
      when BigDecimal then value.to_s("F")
      when Time, ActiveSupport::TimeWithZone then value.utc.iso8601
      else value
      end
    end

    def freeze_digest
      self.frozen_digest = computed_digest
    end

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end

    def same_company
      return if payroll_run&.company_id == company_id && payroll_revision&.payroll_run_id == payroll_run_id &&
        employment&.company_id == company_id && recipient_link&.company_id == company_id &&
        payroll_payment_group&.payroll_run_id == payroll_run_id && payroll_payment_group&.employment_id == employment_id

      errors.add(:base, "Payment records must belong to one company and run")
    end
end
