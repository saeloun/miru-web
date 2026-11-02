# frozen_string_literal: true

class ConsultantCompensation < ApplicationRecord
  SOURCES = %w[india mercury_us].freeze
  belongs_to :employment
  belongs_to :created_by, class_name: "User"
  has_one :company, through: :employment
  before_validation :require_payroll_entitlement, on: :create
  audited associated_with: :company, only: [:effective_on]
  attr_readonly :employment_id, :created_by_id, :effective_on, :monthly_fee, :hours_per_day,
    :weekdays, :payment_source, :legal_entity_name, :change_reason

  validates :effective_on, :legal_entity_name, :change_reason, presence: true
  validates :legal_entity_name, length: { maximum: 200 }
  validates :change_reason, length: { maximum: 1000 }
  validates :payment_source, inclusion: { in: SOURCES }
  validates :monthly_fee, numericality: { greater_than: 0, less_than: 10_000_000_000 }
  validates :hours_per_day, numericality: { greater_than: 0, less_than_or_equal_to: 24 }
  validate :valid_terms

  private

    def require_payroll_entitlement
      Payroll::Entitlement.require!(employment&.company_id)
    end

    def valid_terms
      [:monthly_fee, :hours_per_day].each do |attribute|
        value = public_send("#{attribute}_before_type_cast")
        formatted = value.is_a?(BigDecimal) ? value.to_s("F") : value.to_s
        errors.add(attribute, "must have up to two decimal places") unless formatted.match?(/\A\d{1,10}(\.\d{1,2})?\z/)
      end
      raw_days = weekdays_before_type_cast
      unless raw_days.is_a?(Array) && raw_days.any? && raw_days.all? { |day| day.to_s.match?(/\A[1-7]\z/) } && raw_days.map(&:to_i).uniq.size == raw_days.size
        errors.add(:weekdays, "must contain distinct weekday numbers from 1 to 7")
      end
      raw_date = effective_on_before_type_cast
      errors.add(:effective_on, "must be between 1900 and 2099") if effective_on && !(1900..2099).cover?(effective_on.year)
      if raw_date.is_a?(String)
        begin
          raise Date::Error unless raw_date.match?(/\A\d{4}-\d{2}-\d{2}\z/)

          Date.iso8601(raw_date)
        rescue Date::Error
          errors.add(:effective_on, "must be an ISO date")
        end
      end
    end
end
