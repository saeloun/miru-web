# frozen_string_literal: true

class ProfitabilityScenario < ApplicationRecord
  belongs_to :company
  belongs_to :created_by, class_name: "User", inverse_of: :profitability_scenarios, optional: true
  serialize :worksheet, coder: JSON, type: Hash
  encrypts :worksheet, :name
  audited associated_with: :company, only: [:company_id, :created_by_id]
  validates :name, presence: true, length: { maximum: 100 }
  validates :created_by, presence: true, on: :create
  validate :valid_worksheet

  private

    def valid_worksheet
      if worksheet.to_json.bytesize > 128_000
        errors.add(:worksheet, "is too large")
        return
      end
      %w[baseline assumptions].each { |key| Reports::ProfitabilityProjection.new(worksheet[key]).process }
      unless worksheet.dig("baseline", "currency") == worksheet.dig("assumptions", "currency")
        errors.add(:worksheet, "currency cannot change; create a new plan in the desired currency")
      end
      if persisted? && worksheet["baseline"] != worksheet_in_database["baseline"]
        errors.add(:worksheet, "first saved baseline cannot change")
      end
      if persisted? && worksheet["source"] != worksheet_in_database["source"]
        errors.add(:worksheet, "source history cannot change")
      end
    rescue Reports::ProfitabilityProjection::InvalidAssumptions => error
      errors.add(:worksheet, error.message)
    end
end
