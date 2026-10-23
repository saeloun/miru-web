# frozen_string_literal: true

class ProjectMember < ApplicationRecord
  include Discardable

  belongs_to :project
  belongs_to :user
  delegate :full_name, :timesheet_entries, to: :user

  validates :hourly_rate, presence: true
  after_save :record_profitability_billing_rate, if: :saved_change_to_hourly_rate?

  def record_profitability_billing_rate
    # A current edit establishes a rate from today, never a guessed historical effective date.
    return unless hourly_rate && !hourly_rate.negative? && EmployeeRecord.supported_currency?(project.client.currency)
    return unless Employment.exists?(company_id: project.client.company_id, user_id:)

    rates = ProfitabilityBillingRate.where(project_id:, user_id:).where("effective_on <= ?", Date.current)
    latest = rates.order(:effective_on, :id).last
    return if latest&.billing_method == "fixed_fee"
    if hourly_rate.zero?
      return unless latest&.hourly_rate&.zero? ||
        (saved_change_to_hourly_rate? && hourly_rate_before_last_save.to_d.positive?)
    end
    return if latest&.hourly_rate == hourly_rate && latest&.currency == project.client.currency

    ProfitabilityBillingRate.create!(project:, user:, hourly_rate:, currency: project.client.currency, effective_on: Date.current)
  end
end
