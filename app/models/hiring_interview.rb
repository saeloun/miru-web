# frozen_string_literal: true

class HiringInterview < ApplicationRecord
  DETAIL_KEYS = %w[title kind duration_minutes criteria preparation feedback_questions].freeze
  STATUSES = %w[planned completed skipped cancelled].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :created_by, class_name: "User", optional: true
  belongs_to :previous_interview, class_name: "HiringInterview", optional: true
  has_many :hiring_access_grants, dependent: :destroy
  has_many :events, class_name: "HiringInterviewEvent", dependent: :destroy
  has_many :hiring_interview_bookings, dependent: :destroy
  serialize :details, coder: JSON, type: Hash
  serialize :request_details, coder: JSON, type: Hash
  serialize :panel_snapshot, coder: JSON, type: Array
  encrypts :details, :request_details, :panel_snapshot
  self.filter_attributes += [:details, :request_details, :panel_snapshot]

  validates :status, inclusion: { in: STATUSES }
  validates :number, numericality: { only_integer: true, greater_than: 0 }
  validate :matching_application
  validate :valid_details
  validate :fixed_history, on: :update

  def admin_details
    slice(:id, :number, :status, :lock_version, :previous_interview_id, :ended_at).merge(details:, panel: panel_snapshot)
  end

  def cancel_for_stage!(actor:)
    with_lock do
      return unless status == "planned"

      update!(status: "cancelled", ended_at: Time.current)
      close_bookings!(reason: "Application moved to #{hiring_application.stage}")
      hiring_access_grants.active.update_all(revoked_at: Time.current)
      events.create!(company:, created_by: actor, action: "cancelled", interview_version: lock_version,
        application_version: hiring_application.lock_version,
        details: { "actor_name" => actor&.full_name || "System", "round" => admin_details.deep_stringify_keys,
          "reason" => "Application moved to #{hiring_application.stage}" })
    end
  end

  def close_bookings!(status: "cancelled", reason:)
    hiring_interview_bookings.scheduled.find_each { |booking| booking.end!(status:, reason:) }
  end

  private

    def matching_application
      errors.add(:base, "Choose an application in this workspace") unless hiring_application&.company_id == company_id
      if previous_interview && previous_interview.hiring_application_id != hiring_application_id
        errors.add(:base, "Repeat a round from this application")
      end
    end

    def valid_details
      text = ->(value, maximum, required = false) do
        value.is_a?(String) && value.valid_encoding? && value.length <= maximum && (!required || value.strip.present?) &&
          !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
      end
      questions = details["feedback_questions"]
      valid = details.except("hiring_notes").keys.sort == DETAIL_KEYS.sort &&
        (!details.key?("hiring_notes") || text.call(details["hiring_notes"], 5000)) && text.call(details["title"], 200, true) &&
        text.call(details["kind"], 100, true) && text.call(details["criteria"], 5000, true) &&
        text.call(details["preparation"], 5000) && details["duration_minutes"].is_a?(Integer) &&
        details["duration_minutes"].between?(1, 1440) && questions.is_a?(Array) && questions.size.between?(1, 20) &&
        questions.all? { |question| text.call(question, 500, true) } && questions.uniq.size == questions.size
      errors.add(:base, "Complete the round title, type, duration, criteria and feedback questions") unless valid
    end

    def fixed_history
      fixed = %w[company_id hiring_application_id created_by_id previous_interview_id number request_key request_details]
      if fixed.any? { |field| will_save_change_to_attribute?(field) } || status_in_database != "planned"
        errors.add(:base, "Completed interview history cannot be rewritten; add a new round")
      end
    end
end
