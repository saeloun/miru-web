# frozen_string_literal: true

class PayrollMercuryRecipientLink < ApplicationRecord
  BENEFICIARIES = %w[consultant spouse].freeze

  belongs_to :company
  belongs_to :employment
  belongs_to :split_arrangement, class_name: "PayrollSplitArrangement", optional: true
  belongs_to :verified_by, class_name: "User"

  before_validation :require_payroll_entitlement, on: :create

  validates :beneficiary, inclusion: { in: BENEFICIARIES }
  validates :mercury_recipient_id, format: { with: PayrollMercuryConnection::UUID }
  validates :recipient_digest, :bank_details_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :display_name, :account_mask, :swift_code, presence: true
  validate :employment_in_company, on: :create

  scope :latest_first, -> { order(id: :desc) }

  def self.current_for(employment, beneficiary)
    where(employment_id: employment.id, company_id: employment.company_id, beneficiary:).latest_first.first
  end

  def readonly?
    persisted?
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end

    def employment_in_company
      errors.add(:employment, "must belong to this company") unless employment&.company_id == company_id
    end
end
