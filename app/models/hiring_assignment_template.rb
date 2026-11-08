# frozen_string_literal: true

class HiringAssignmentTemplate < ApplicationRecord
  DETAIL_KEYS = %w[instructions criteria expected_minutes submission_method ai_policy].freeze
  SUBMISSION_METHODS = %w[repository files repository_or_files].freeze

  belongs_to :company
  belongs_to :hiring_role, optional: true
  has_many :revisions, class_name: "HiringAssignmentTemplateRevision", dependent: :destroy
  serialize :details, coder: JSON
  encrypts :details
  self.filter_attributes += [:details]

  validates :status, inclusion: { in: %w[draft approved archived] }
  validate :valid_fields
  validate :matching_role
  validate -> { errors.add(:base, "A task cannot move between workspaces") if will_save_change_to_company_id? }, on: :update

  def complete?
    details.is_a?(Hash) && details.keys.sort == DETAIL_KEYS.sort && %w[instructions criteria ai_policy].all? { |key| details[key].present? } &&
      details["expected_minutes"].present? && details["submission_method"].present?
  end

  def summary_details
    slice(:id, :title, :skills, :experience, :status, :lock_version).merge(role: hiring_role&.slice(:id, :title, :status))
  end

  def review_details = summary_details.merge(details:)

  private

    def valid_fields
      fields = { title: [title, 200], skills: [skills, 500], experience: [experience, 500] }
      fields.each do |key, (value, maximum)|
        errors.add(key, "must be valid text") unless value.is_a?(String) && value.valid_encoding? &&
          value.length <= maximum && !value.match?(/[[:cntrl:]]/) && (key != :title || value.strip.present?)
      end
      valid = details.is_a?(Hash) && (details.keys - DETAIL_KEYS).empty? && details.all? do |key, value|
        case key
        when "expected_minutes" then value.is_a?(Integer) && value.between?(1, 10_080)
        when "submission_method" then SUBMISSION_METHODS.include?(value)
        else
          value.is_a?(String) && value.valid_encoding? && value.length <= 10_000 && !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
        end
      end
      errors.add(:details, "must use valid task instructions, criteria, effort, method and AI policy") unless valid
    end

    def matching_role
      errors.add(:base, "Choose a role in this workspace") if hiring_role && hiring_role.company_id != company_id
    end
end
