# frozen_string_literal: true

class ProfitabilityProfile < ApplicationRecord
  belongs_to :employment
  belongs_to :primary_project, class_name: "Project", optional: true
  has_one :company, through: :employment
  audited associated_with: :company

  validates :employment_id, uniqueness: true
  validates :department, length: { maximum: 100 }
  validates :hours_per_day, numericality: { greater_than: 0, less_than_or_equal_to: 24 }, allow_nil: true
  validate :valid_schedule_and_project

  private

    def valid_schedule_and_project
      unless weekdays.is_a?(Array) && weekdays.uniq == weekdays && weekdays.all? { |day| (1..7).cover?(day) }
        errors.add(:weekdays, "must contain distinct ISO weekdays (1–7)")
      end
      if primary_project && primary_project.client.company_id != employment.company_id
        errors.add(:primary_project, "must belong to the employment workspace")
      end
    end
end
