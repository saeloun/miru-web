# frozen_string_literal: true

class PayrollSplitArrangement < ApplicationRecord
  KINDS = %w[percentage fixed_inr].freeze
  PARTIES = %w[consultant spouse].freeze
  DETAIL_KEYS = %w[bank_account_name bank_name bank_country bank_account_number bank_ifsc bank_swift].freeze
  FROZEN_FIELDS = %w[company_id employment_id requested_by_id details allocation_kind allocation_value allocated_to remainder_to].freeze

  self.filter_attributes += [:details]
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  attr_readonly(*FROZEN_FIELDS)

  belongs_to :company
  belongs_to :employment
  belongs_to :requested_by, class_name: "User"
  belongs_to :verified_by, class_name: "User", optional: true
  belongs_to :approved_by, class_name: "User", optional: true
  belongs_to :withdrawn_by, class_name: "User", optional: true
  audited associated_with: :company, only: [:allocation_kind, :allocated_to, :remainder_to, :verified_at, :approved_at, :withdrawn_at]

  before_validation :require_payroll_entitlement

  validates :allocation_kind, inclusion: { in: KINDS }
  validates :allocated_to, :remainder_to, inclusion: { in: PARTIES }
  validates :allocation_value, numericality: { greater_than: 0 }
  validate :valid_allocation
  validate :valid_details
  validate :employment_in_company, on: :create

  def self.current_for(employment)
    where(employment_id: employment.id, company_id: employment.company_id, withdrawn_at: nil).order(id: :desc).first
  end

  def active?
    approved_at.present? && withdrawn_at.nil?
  end

  def withdrawn?
    withdrawn_at.present?
  end

  def bank_details
    details.slice("bank_account_name", "bank_account_number", "bank_ifsc", "bank_swift")
  end

  def masked
    { name: details["bank_account_name"], bank_name: details["bank_name"], account_mask: details["bank_account_number"].to_s.last(4),
      swift_code: details["bank_swift"] }
  end

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(company_id)
    end

    def employment_in_company
      errors.add(:employment, "must belong to this company") unless employment&.company_id == company_id
    end

    def valid_allocation
      errors.add(:remainder_to, "must be the other party") if allocated_to == remainder_to
      return unless allocation_kind == "percentage" && allocation_value

      errors.add(:allocation_value, "must be between 0 and 100") unless allocation_value.positive? && allocation_value < 100
    end

    def valid_details
      errors.add(:details, "has unsupported fields") if (details.keys - DETAIL_KEYS).any?
      DETAIL_KEYS.each do |key|
        value = details[key]
        errors.add(:details, "#{key} is required") unless value.is_a?(String) && value.strip.length.between?(1, 200)
      end
      { "bank_account_number" => /\A\d{1,34}\z/, "bank_ifsc" => /\A[A-Z]{4}0[A-Z0-9]{6}\z/,
        "bank_swift" => /\A[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\z/ }.each do |key, format|
        errors.add(:details, "#{key} is invalid") unless details[key].to_s.match?(format)
      end
    end
end
