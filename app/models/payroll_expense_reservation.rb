# frozen_string_literal: true

class PayrollExpenseReservation < ApplicationRecord
  belongs_to :company
  belongs_to :expense
  belongs_to :payroll_run
  belongs_to :payroll_revision
  belongs_to :employment
  audited associated_with: :company, only: [:expense_id, :settled_at, :released_at]

  before_validation :require_payroll_entitlement, on: :create

  validates :amount_minor, numericality: { only_integer: true, greater_than: 0 }

  scope :active, -> { where(released_at: nil) }
  scope :unsettled, -> { active.where(settled_at: nil) }

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end
end
