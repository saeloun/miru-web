# frozen_string_literal: true

class Api::V1::Hiring::BookingsController < Api::V1::Hiring::BaseController
  rescue_from ::Hiring::InterviewTime::Ambiguous do |error|
    render json: { errors: error.message, offset_options: error.offsets }, status: 422
  end

  def index
    with_interview do |interview|
      rows, pagination = page_records(interview.hiring_interview_bookings.order(number: :desc))
      submission = interview.hiring_application.hiring_submissions.where.not(submitted_at: nil).order(id: :desc).first
      candidate_zone = submission&.answers&.fetch("time_zone", nil)
      render json: context(interview).merge(bookings: rows.map(&:admin_details), pagination:,
        current_booking_id: interview.hiring_interview_bookings.scheduled.pick(:id),
        candidate_time_zone: candidate_zone.is_a?(String) ? candidate_zone : nil)
    end
  end

  def create
    attributes = mutation_attributes(:hiring_booking, ::Hiring::Scheduling::CREATE_KEYS)
    with_interview do |interview|
      booking = ::Hiring::Scheduling.new(interview:, actor: current_user).create!(attributes:)
      render json: context(interview).merge(booking: booking.admin_details), status: booking.previously_new_record? ? 201 : 200
    end
  end

  def update
    attributes = mutation_attributes(:hiring_booking, ::Hiring::Scheduling::END_KEYS)
    with_interview do |interview|
      booking = interview.hiring_interview_bookings.find(optional_id(:id))
      ::Hiring::Scheduling.new(interview:, actor: current_user).end!(booking:, attributes:)
      render json: context(interview).merge(booking: booking.admin_details)
    end
  end

  private

    def context(interview)
      { company_id: current_company.id, application: interview.hiring_application.slice(:id, :stage, :lock_version),
        interview: interview.slice(:id, :number, :status, :lock_version).merge(details: interview.details) }
    end

    def with_interview
      current_user.with_lock do
        authorize_hiring
        current_company.lock!("FOR NO KEY UPDATE") unless request.get? || request.head?
        application = current_company.hiring_applications.find(optional_id(:application_id))
        application.with_lock do
          interview = application.hiring_interviews.find(optional_id(:interview_id))
          interview.with_lock { yield interview }
        end
      end
    end
end
