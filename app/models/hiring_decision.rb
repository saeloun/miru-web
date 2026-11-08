# frozen_string_literal: true

class HiringDecision < ApplicationRecord
  OUTCOMES = %w[pass reject hold additional_round_required].freeze
  DETAIL_KEYS = %w[outcome reason owner_employment_id owner_name follow_up_on time_zone].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :finalized_by, class_name: "User", optional: true
  %i[request_details edit_details finalization_details details].each do |field|
    serialize field, coder: JSON, type: Hash
    encrypts field
  end
  self.filter_attributes += [:request_details, :edit_details, :finalization_details, :details]
  audited associated_with: :company, only: [:state, :finalized_by_id, :finalized_at]

  validates :state, inclusion: { in: %w[draft finalized] }
  validates :request_key, format: { with: /\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i }
  validates :request_details, presence: true
  validate :valid_details
  validate :matching_application
  validate :valid_finalization
  validate :fixed_history, on: :update

  def review_details
    slice(:id, :state, :lock_version, :created_at, :finalized_at).merge(details:,
      created_by_name: created_by&.full_name, finalized_by_name: finalized_by&.full_name)
  end

  private

    def matching_application
      errors.add(:base, "Choose an application in this workspace") unless hiring_application&.company_id == company_id
    end

    def valid_details
      valid = details.keys.sort == DETAIL_KEYS.sort && OUTCOMES.include?(details["outcome"]) &&
        text?(details["reason"], 5000) && text?(details["owner_name"], 1000) && valid_date? && valid_zone?
      owner = details["owner_employment_id"]
      valid &&= owner.nil? || owner.is_a?(Integer) && owner.positive?
      valid &&= owner.nil? && details["follow_up_on"].nil? && details["owner_name"].empty? unless details["outcome"] == "hold"
      errors.add(:base, "Use valid decision details, owner and follow-up date") unless valid
    end

    def valid_date?
      value = details["follow_up_on"]
      return true if value.nil?
      return false unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      date = Date.iso8601(value)
      date.year.positive? && date.iso8601 == value
    rescue Date::Error
      false
    end

    def valid_zone?
      value = details["time_zone"]
      value.is_a?(String) && value.length <= 100 && TZInfo::Timezone.get(value).present?
    rescue TZInfo::InvalidTimezoneIdentifier
      false
    end

    def text?(value, limit)
      value.is_a?(String) && value.valid_encoding? && value.length <= limit && !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
    end

    def valid_finalization
      valid = if state == "draft"
        finalized_at.nil? && finalized_by_id.nil? && finalization_details.empty?
      else
        finalized_at.present? && finalization_details.present? && details["reason"].present? &&
          (details["outcome"] != "hold" || details["owner_employment_id"].present? && details["owner_name"].present? && details["follow_up_on"].present?)
      end
      errors.add(:base, "Complete the decision before finalizing it") unless valid
    end

    def fixed_history
      fixed = %w[company_id hiring_application_id created_by_id request_key request_details created_at]
      if state_in_database == "finalized" && changed? || fixed.any? { |field| will_save_change_to_attribute?(field) }
        errors.add(:base, "Finalized decisions cannot be rewritten; save a new decision")
      end
    end
end
