# frozen_string_literal: true

class Api::V1::Hiring::InterviewMessagesController < Api::V1::Hiring::BaseController
  def index
    communication.with_booking do
      rows, pagination = page_records(communication.messages.order(id: :desc))
      render json: { company_id: current_company.id, messages: rows.map { |message| details(message) }, pagination: }
    end
  end

  def preview
    attributes = mutation_attributes(:hiring_message, %w[company_id kind mailbox_id])
    render json: { company_id: current_company.id, preview: communication.preview!(kind: attributes["kind"], mailbox_id: attributes["mailbox_id"]) }
  end

  def create
    message, created = communication.queue!(attributes: mutation_attributes(:hiring_message, Hiring::InterviewCommunication::KEYS))
    render json: { company_id: current_company.id, message: details(message) }, status: created ? 201 : 200
  end

  def retry
    attributes = mutation_attributes(:hiring_message, Hiring::InterviewCommunication::KEYS + ["message_version"])
    message, = communication.queue!(attributes: attributes.except("message_version"), retry_of: communication.messages.find(optional_id(:id)),
      message_version: attributes["message_version"])
    render json: { company_id: current_company.id, message: details(message) }, status: 201
  end

  def reconcile
    attributes = mutation_attributes(:hiring_message, %w[company_id message_version outcome evidence worker_stopped])
    message = communication.reconcile!(message: communication.messages.find(optional_id(:id)), message_version: attributes["message_version"],
      outcome: attributes["outcome"], evidence: attributes["evidence"], worker_stopped: attributes["worker_stopped"])
    render json: { company_id: current_company.id, message: details(message) }
  end

  private

    def communication
      @communication ||= begin
        application = current_company.hiring_applications.find(optional_id(:application_id))
        interview = application.hiring_interviews.find(optional_id(:interview_id))
        booking = interview.hiring_interview_bookings.find(optional_id(:booking_id))
        Hiring::InterviewCommunication.new(booking:, actor: current_user)
      end
    end

    def details(message)
      message.slice(:id, :kind, :state, :error_code, :lock_version, :attempt_number, :original_message_id, :sent_at,
        :resolution, :resolution_details, :resolved_at).merge(retryable: message.retryable? && message.attempts.order(attempt_number: :desc).pick(:id) == message.id,
          content: message.content.slice("to", "reply_to", "subject", "body"))
    end
end
