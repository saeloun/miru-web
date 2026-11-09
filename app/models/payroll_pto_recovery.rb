# frozen_string_literal: true

class PayrollPtoRecovery < ApplicationRecord
  self.filter_attributes += [:reason]
  belongs_to :company
  belongs_to :employment
  belongs_to :payroll_pto_entry
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :previous_recovery, class_name: "PayrollPtoRecovery", optional: true
  belongs_to :actor, class_name: "User", optional: true
  validates :kind, inclusion: { in: %w[reserved released settled returned_review] }
  scope :heads, -> { where.not(id: PayrollPtoRecovery.where.not(previous_recovery_id: nil).select(:previous_recovery_id)) }

  def readonly?
    persisted?
  end
end
