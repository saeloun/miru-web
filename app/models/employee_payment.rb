# frozen_string_literal: true

class EmployeePayment < ApplicationRecord
  belongs_to :employment
  belongs_to :created_by, class_name: "User"
  has_one :company, through: :employment
  audited associated_with: :company, only: [:employment_id]

  validates :paid_on, :reference, presence: true
  validates :reference, length: { maximum: 200 }, uniqueness: { scope: :employment_id }
  validates :note, length: { maximum: 2000 }
  validates :amount, numericality: { greater_than: 0, less_than: 10_000_000_000 }
  validate :valid_values

  private

    def valid_values
      value = amount_before_type_cast
      value = value.to_s("F") if value.is_a?(BigDecimal)
      errors.add(:amount, "must have up to two decimal places") unless value.is_a?(String) && value.match?(EmployeeRecord::AMOUNT_FORMAT)
      errors.add(:currency, "is unsupported") unless EmployeeRecord.supported_currency?(currency)
      date = paid_on_before_type_cast
      unless date.is_a?(Date) || EmployeeRecord.iso_date?(date)
        errors.add(:paid_on, "must be a valid ISO date")
      end
    end
end
