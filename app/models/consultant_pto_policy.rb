# frozen_string_literal: true

class ConsultantPtoPolicy < ApplicationRecord
  self.filter_attributes += [:reason, :evidence]
  belongs_to :company
  belongs_to :employment
  belongs_to :created_by, class_name: "User"
  validates :effective_on, :opening_on, :reason, :evidence, :idempotency_key, presence: true
  validates :reason, length: { maximum: 1000 }
  validates :evidence, :idempotency_key, length: { maximum: 128 }
  validates :accrual_day, :leave_year_day, inclusion: { in: 1..28 }
  validates :leave_year_month, inclusion: { in: 1..12 }
  validates :carry_rule, inclusion: { in: ["review"] }
  validates :rate_basis, inclusion: { in: ["origin_period_fee"] }
  validates :monthly_accrual_minutes, :advance_limit_minutes, :exception_threshold_minutes,
    :negative_threshold_minutes, numericality: { greater_than_or_equal_to: 0, less_than: 1_000_000_000 }
  validates :opening_minutes, numericality: { greater_than: -1_000_000_000, less_than: 1_000_000_000 }

  def readonly?
    persisted?
  end

  def accrual_eligible?(month, through:)
    due = month.change(day: accrual_day)
    due > opening_on && due <= through && employment.joined_at.present? && due >= employment.joined_at &&
      (employment.resigned_at.nil? || due <= employment.resigned_at)
  end
end
