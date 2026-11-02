# frozen_string_literal: true

class ProfitabilityBillingRate < ApplicationRecord
  belongs_to :project
  belongs_to :user
  delegate :company, to: :project
  audited associated_with: :company, only: [:project_id, :user_id, :effective_on]
  attr_readonly :project_id, :user_id, :effective_on, :hourly_rate, :currency, :billing_method

  validates :effective_on, presence: true
  validates :billing_method, inclusion: { in: %w[hourly fixed_fee] }
  validates :hourly_rate, numericality: { greater_than_or_equal_to: 0 }, if: -> { billing_method == "hourly" }
  validates :hourly_rate, absence: true, if: -> { billing_method == "fixed_fee" }
  validate do
    errors.add(:currency, "is unsupported") unless EmployeeRecord.supported_currency?(currency)
    unless project && Employment.exists?(company_id: project.client.company_id, user_id:)
      errors.add(:user, "must belong to the project workspace")
    end
  end
end
