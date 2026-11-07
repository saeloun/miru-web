# frozen_string_literal: true

class HiringFeedback < ApplicationRecord
  CLOSED_APPLICATION_STAGES = %w[hired rejected withdrawn].freeze
  BOOKING_STATUSES = %w[scheduled completed no_show].freeze
  ASSESSMENT_FIELDS = %w[topics assessment technical_skills communication strengths concerns].freeze
  REQUIRED_ASSESSMENT_FIELDS = %w[topics assessment communication].freeze
  DETAIL_KEYS = (ASSESSMENT_FIELDS + %w[interview_on attendance evidence recommendation answers]).freeze

  belongs_to :company
  belongs_to :hiring_interview_booking
  belongs_to :hiring_panel_member, optional: true
  belongs_to :submitted_by, class_name: "User", optional: true
  serialize :panel_snapshot, coder: JSON, type: Hash
  serialize :request_details, coder: JSON, type: Hash
  serialize :details, coder: JSON, type: Hash
  encrypts :panel_snapshot, :request_details, :details
  self.filter_attributes += [:panel_snapshot, :request_details, :details]
  validate :matching_request, on: :create
  validate :valid_submission
  validate :fixed_history, on: :update

  def self.assigned_to(actor, company)
    ids = HiringPolicy.staff_members(company).where(user_id: actor.id).select(:id)
    where(company:).joins(:hiring_panel_member).where(hiring_panel_members: { company_id: company.id, employment_id: ids })
      .where("hiring_feedbacks.hiring_panel_member_id = hiring_feedbacks.issued_panel_member_id")
  end

  def self.collectible
    joins(hiring_interview_booking: { hiring_interview: :hiring_application })
      .where(hiring_interview_bookings: { status: BOOKING_STATUSES }, hiring_interviews: { status: %w[planned completed] })
      .where.not(hiring_applications: { stage: CLOSED_APPLICATION_STAGES })
  end

  def self.seed_missing
    HiringInterviewBooking.where(status: BOOKING_STATUSES).joins(hiring_interview: :hiring_application)
      .where.not(hiring_applications: { stage: CLOSED_APPLICATION_STAGES }).where.missing(:hiring_feedbacks).find_each(&:request_feedback!)
  end

  def self.for_previous_rounds(interview)
    where(company: interview.company).where.not(submitted_at: nil).joins(hiring_interview_booking: :hiring_interview)
      .where(hiring_interview_bookings: { status: BOOKING_STATUSES }, hiring_interviews: { hiring_application_id: interview.hiring_application_id })
      .where("hiring_interviews.number < ?", interview.number)
  end

  def open?
    booking = hiring_interview_booking
    BOOKING_STATUSES.include?(booking.status) && %w[planned completed].include?(booking.hiring_interview.status) &&
      !CLOSED_APPLICATION_STAGES.include?(booking.hiring_interview.hiring_application.stage)
  end

  def ready? = submitted_at.nil? && open? && hiring_interview_booking.starts_at <= Time.current

  def state
    return "submitted" if submitted_at
    return "unavailable" unless open? && hiring_panel_member&.active?
    return "upcoming" if hiring_interview_booking.starts_at > Time.current

    hiring_interview_booking.feedback_due_at < Time.current ? "overdue" : "pending"
  end

  def review_details
    booking = hiring_interview_booking
    { id:, lock_version:, state:, submitted_at:, details: submitted_at ? details : nil,
      reviewer_name: panel_snapshot.fetch("full_name"), late: submitted_at.present? && submitted_at > booking.feedback_due_at,
      booking: { id: booking.id, number: booking.number, status: booking.status, starts_at: booking.starts_at.utc.iso8601(6),
        ends_at: booking.ends_at.utc.iso8601(6), feedback_due_at: booking.feedback_due_at.utc.iso8601(6),
        candidate_time_zone: booking.details.fetch("candidate_time_zone") },
      round: booking.round_details.slice("title", "kind", "criteria", "feedback_questions").merge("number" => booking.hiring_interview.number) }
  end

  private

    def matching_request
      booking = hiring_interview_booking
      issued = booking&.panel_snapshot&.find { |member| member["panel_member_id"] == issued_panel_member_id }
      unless booking&.company_id == company_id && issued && panel_snapshot == issued.slice("panel_member_id", "employment_id", "full_name") &&
          (hiring_panel_member.nil? || hiring_panel_member.company_id == company_id && hiring_panel_member.id == issued_panel_member_id)
        errors.add(:base, "Choose the issued booking and panel member in this workspace")
      end
    end

    def valid_submission
      if submitted_at.nil?
        errors.add(:base, "Submit all feedback fields together") unless details.empty? && request_details.empty? && request_key.nil? && submitted_by_id.nil?
        return
      end
      unless request_key.to_s.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i) && request_details.present? && valid_details?
        errors.add(:base, "Complete the actual date, attendance, assessment, examples, questions and recommendation")
      end
    end

    def valid_details?
      return false unless details.keys.sort == DETAIL_KEYS.sort && actual_date? && text?(details["evidence"], required: true)

      attended = details["attendance"] == "attended"
      choices = %w[pass fail hold additional_round_required]
      answers = details["answers"]
      %w[attended no_show].include?(details["attendance"]) && choices.include?(details["recommendation"]) &&
        ASSESSMENT_FIELDS.all? { |key| text?(details[key], required: attended && REQUIRED_ASSESSMENT_FIELDS.include?(key)) && (attended || details[key].blank?) } &&
        answers.is_a?(Array) && answers.size == hiring_interview_booking.round_details.fetch("feedback_questions").size &&
        answers.all? { |answer| text?(answer, required: attended) }
    end

    def actual_date?
      value = details["interview_on"]
      return false unless value.is_a?(String) && value.valid_encoding? && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      date = Date.iso8601(value)
      zone = TZInfo::Timezone.get(hiring_interview_booking.details.fetch("candidate_time_zone"))
      date.year.positive? && date.iso8601 == value && date <= zone.to_local(Time.current).to_date
    rescue Date::Error
      false
    end

    def text?(value, required: false)
      value.is_a?(String) && value.valid_encoding? && value.length <= 5000 && (!required || value.strip.present?) &&
        !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
    end

    def fixed_history
      fixed = attribute_names - %w[request_key request_details details submitted_by_id submitted_at updated_at lock_version]
      if submitted_at_in_database || fixed.any? { |field| will_save_change_to_attribute?(field) }
        errors.add(:base, "Submitted feedback and its issued request cannot be rewritten")
      end
    end
end
