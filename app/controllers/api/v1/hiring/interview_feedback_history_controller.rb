# frozen_string_literal: true

class Api::V1::Hiring::InterviewFeedbackHistoryController < Api::V1::Hiring::BaseController
  def index
    current_user.with_lock do
      authorize_hiring
      application = current_company.hiring_applications.find(optional_id(:application_id))
      application.with_lock do
        interview = application.hiring_interviews.find(optional_id(:interview_id))
        interview.with_lock do
          rows, pagination = page_records(current_company.hiring_feedbacks.joins(:hiring_interview_booking)
            .where(hiring_interview_bookings: { hiring_interview_id: interview.id })
            .order("hiring_interview_bookings.number DESC", "hiring_feedbacks.id DESC"))
          notices = current_company.hiring_messages.where(hiring_application_id: application.id, kind: HiringMessage::FEEDBACK_KINDS,
            event_key: rows.map { |feedback| "feedback:#{feedback.id}" }).order(:id).group_by(&:event_key)
          feedbacks = rows.map do |feedback|
            notifications = notices.fetch("feedback:#{feedback.id}", []).map do |message|
              message.slice(:id, :kind, :state, :error_code, :sent_at).merge(content: message.content.slice("to", "reply_to", "subject", "body"))
            end
            feedback.review_details.merge(notifications:)
          end
          render json: { company_id: current_company.id, feedbacks:, pagination: }
        end
      end
    end
  end
end
