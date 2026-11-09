# frozen_string_literal: true

class PayrollPtoEntry < ApplicationRecord
  self.filter_attributes += [:reason, :rate_basis]
  belongs_to :company
  belongs_to :employment
  belongs_to :consultant_pto_policy
  belongs_to :actor, class_name: "User"
  belongs_to :previous_entry, class_name: "PayrollPtoEntry", optional: true
  belongs_to :origin_entry, class_name: "PayrollPtoEntry", optional: true
  validates :kind, inclusion: { in: %w[paid unpaid advance defer waive correction allocation accrual opening review_unpaid review_advance review_defer review_waive review_correction] }
  validates :reason, presence: true, length: { maximum: 1000 }
  validates :source_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :idempotency_key, presence: true, length: { maximum: 128 }

  scope :heads, -> { where.not(id: PayrollPtoEntry.where.not(previous_entry_id: nil).select(:previous_entry_id)) }

  def self.effective_heads(date)
    through = where(period: ..date)
    through.where.not(id: through.where.not(previous_entry_id: nil).select(:previous_entry_id))
  end

  def readonly?
    persisted?
  end

  def approved_allocations
    return allocations if allocations.any?
    return [{ "kind" => kind, "minutes" => minutes.to_s("F") }] if Payroll::PtoLedger::DECISIONS.include?(kind)

    []
  end

  def attendance_reference
    return nil if kind == "opening"

    { "period" => rate_basis["origin_period"] || period.iso8601,
      "digest" => rate_basis["origin_source_digest"] || source_digest }
  end
end
