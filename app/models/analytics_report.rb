# frozen_string_literal: true

class AnalyticsReport < ApplicationRecord
  enum :report_type, {
    revenue_forecast: 0,
    team_productivity: 1,
    client_analysis: 2,
    expense_trends: 3
  }

  belongs_to :company
  belongs_to :creator, class_name: "User", foreign_key: :created_by_id, inverse_of: :created_analytics_reports

  validates :name, presence: true, length: { maximum: 100 }
  validates :report_type, presence: true
  validate :filters_must_be_a_hash

  private

    def filters_must_be_a_hash
      errors.add(:filters, "must be a JSON object") unless filters.is_a?(Hash)
    end
end
