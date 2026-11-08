# frozen_string_literal: true

class HiringInterviewBooking < ApplicationRecord
  DETAIL_KEYS = %w[starts_local candidate_time_zone utc_offset meeting_url booking_instructions feedback_hours source].freeze

  belongs_to :company
  belongs_to :hiring_interview
  belongs_to :created_by, class_name: "User", optional: true
  has_many :hiring_feedbacks, dependent: :destroy
  after_create :create_feedback_requests!
  serialize :request_details, coder: JSON, type: Hash
  serialize :details, coder: JSON, type: Hash
  serialize :round_details, coder: JSON, type: Hash
  serialize :panel_snapshot, coder: JSON, type: Array
  encrypts :request_details, :details, :round_details, :panel_snapshot, :ending_reason
  self.filter_attributes += [:request_details, :details, :round_details, :panel_snapshot, :ending_reason]

  scope :scheduled, -> { where(status: "scheduled") }
  validates :number, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: %w[scheduled cancelled completed no_show] }
  validate :matching_interview
  validate :valid_details, on: :create
  validate :valid_times, on: :create
  validate :valid_ending
  validate :fixed_history, on: :update

  def admin_details
    slice(:id, :number, :status, :lock_version, :starts_at, :ends_at, :feedback_due_at, :ended_at, :ending_reason)
      .merge(details:, round_details:, panel: panel_snapshot).then { |result| precise_times(result) }
  end

  def staff_details
    shared = details.slice("candidate_time_zone", "utc_offset", "meeting_url", "booking_instructions")
    unless status == "scheduled"
      shared["meeting_url"] = ""
      shared["booking_instructions"] = ""
    end
    precise_times(slice(:id, :status, :starts_at, :ends_at, :feedback_due_at).merge(details: shared))
  end

  def end!(status:, reason:)
    with_lock { update!(status:, ending_reason: reason, ended_at: Time.current) if self.status == "scheduled" }
  end

  def request_feedback!
    with_lock { create_feedback_requests! }
  end

  private

    def create_feedback_requests!
      panel_snapshot.each do |issued|
        hiring_feedbacks.find_or_create_by!(issued_panel_member_id: issued.fetch("panel_member_id")) do |feedback|
          feedback.company = company
          feedback.hiring_panel_member = company.hiring_panel_members.find_by(id: issued.fetch("panel_member_id"))
          feedback.panel_snapshot = issued.slice("panel_member_id", "employment_id", "full_name")
        end
      end
    end

    def matching_interview
      errors.add(:base, "Choose the interview in this workspace") unless hiring_interview&.company_id == company_id
    end

    def valid_details
      hours = details["feedback_hours"]
      valid = valid_source? &&
        hours.is_a?(Integer) && hours.between?(1, 8760) && text?(details["booking_instructions"], 5000) &&
        text?(details["meeting_url"], 2048) && safe_meeting_url?(details["meeting_url"]) &&
        round_details.except("hiring_notes").keys.sort == HiringInterview::DETAIL_KEYS.sort &&
        round_details["duration_minutes"].is_a?(Integer) && round_details["duration_minutes"].between?(1, 1440) && panel_snapshot.present?
      errors.add(:base, "Use valid booking details and an explicit feedback deadline") unless valid
    end

    def valid_times
      local = if details["source"] == "google_calendar"
        calendar_start
      else
        Hiring::InterviewTime.parse(details["starts_local"], time_zone: details["candidate_time_zone"], utc_offset: details["utc_offset"])
      end
      duration = round_details["duration_minutes"]
      hours = details["feedback_hours"]
      unless starts_at == local && duration.is_a?(Integer) && hours.is_a?(Integer) &&
          ends_at == starts_at + duration.minutes && feedback_due_at == ends_at + hours.hours
        errors.add(:base, "Record the candidate-local time, round duration and feedback deadline consistently")
      end
    rescue Hiring::Intake::InvalidInput, TZInfo::InvalidTimezoneIdentifier, ArgumentError, TypeError, KeyError
      errors.add(:base, "Choose a valid candidate-local date, time and UTC offset")
    end

    def valid_source?
      return details.keys.sort == DETAIL_KEYS.sort if details["source"] == "manual"
      return false unless details["source"] == "google_calendar" && details.keys.sort == (DETAIL_KEYS + ["provider"]).sort

      provider = details["provider"]
      provider.is_a?(Hash) && provider.keys.sort == %w[calendar_id ends_at etag event_id starts_at] &&
        provider.values.all? { |value| text?(value, 1024) && value.strip.present? }
    end

    def calendar_start
      provider = details.fetch("provider")
      raise Hiring::Intake::InvalidInput unless provider.is_a?(Hash)

      start = Time.iso8601(provider.fetch("starts_at"))
      finish = Time.iso8601(provider.fetch("ends_at"))
      local = TZInfo::Timezone.get(details["candidate_time_zone"]).to_local(start)
      unless provider["starts_at"] == start.utc.iso8601(6) && provider["ends_at"] == finish.utc.iso8601(6) && ends_at == finish &&
          details["starts_local"] == local.strftime("%Y-%m-%dT%H:%M:%S.%6N") && details["utc_offset"] == local.strftime("%:z")
        raise Hiring::Intake::InvalidInput
      end
      start
    end

    def precise_times(result)
      return result unless details["source"] == "google_calendar"

      %w[starts_at ends_at feedback_due_at].each { |key| result[key] = public_send(key).utc.iso8601(6) }
      result
    end

    def valid_ending
      valid = status == "scheduled" ? ended_at.nil? && ending_reason.nil? : ended_at.present? && text?(ending_reason, 2000) && ending_reason.strip.present?
      errors.add(:base, "Record the reason before ending a booking") unless valid
    end

    def fixed_history
      fixed = attribute_names - %w[status ended_at ending_reason updated_at lock_version]
      if status_in_database != "scheduled" || fixed.any? { |field| will_save_change_to_attribute?(field) }
        errors.add(:base, "Booking history cannot be rewritten; record a replacement booking")
      end
    end

    def text?(value, maximum)
      value.is_a?(String) && value.valid_encoding? && value.length <= maximum && !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
    end

    def safe_meeting_url?(value)
      return true if value.blank?
      return false if value.match?(/[[:space:][:cntrl:]]/)

      uri = URI.parse(value)
      uri.scheme == "https" && uri.host.present? && uri.userinfo.nil?
    rescue URI::InvalidURIError
      false
    end
end
