# frozen_string_literal: true

class CompensationVersion < ApplicationRecord
  belongs_to :employment
  serialize :salary_details, coder: JSON, type: Hash
  encrypts :salary_details
  scope :active, -> { where(superseded_at: nil) }
  validates :effective_on, presence: true
  attr_readonly :employment_id, :effective_on, :salary_details

  def self.history_requires_review?(employment)
    versions = employment.compensation_versions
    return true if versions.any? { |version| version.superseded_at.nil? && version.reviewed_at.nil? }

    # Undated settings do not supersede established history.
    salary = employment.employee_record&.unversioned_salary if versions.any?
    EmployeeRecord.iso_date?(salary&.fetch("salary_effective_on", nil)).present?
  end

  def self.terms_for(employment)
    return [] if history_requires_review?(employment)

    terms = employment.compensation_versions.reject(&:superseded_at)
      .map { |version| [version.effective_on, version.id, version.salary_details] }
    # Existing encrypted salaries remain usable without inventing an effective date.
    if employment.compensation_versions.empty? && (details = employment.employee_record&.private_details)
      date = EmployeeRecord.iso_date?(details["salary_effective_on"])
      terms << [date, 0, details.slice(*EmployeeRecord::SALARY_KEYS)] if date
    end
    # A later-recorded complete correction resolves incomplete terms from its date onward.
    terms.reject! do |date, id, details|
      !complete_salary?(details) && terms.any? do |later_date, later_id, later_details|
        later_id > id && later_date <= date && complete_salary?(later_details)
      end
    end
    terms.sort_by { |date, id, _details| [date, id] }
  end

  def self.complete_salary?(details)
    EmployeeRecord.iso_date?(details["salary_effective_on"]) &&
      details["salary_amount"].to_s.match?(EmployeeRecord::AMOUNT_FORMAT) && details["salary_amount"].to_d.positive? &&
      EmployeeRecord.supported_currency?(details["salary_currency"]) && %w[monthly annual].include?(details["salary_frequency"])
  end
end
