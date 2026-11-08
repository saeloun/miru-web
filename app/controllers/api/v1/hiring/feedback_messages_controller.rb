# frozen_string_literal: true

class Api::V1::Hiring::FeedbackMessagesController < Api::V1::Hiring::CandidateMessagesController
  private

    def communication
      @communication ||= begin
        application = current_company.hiring_applications.find(request.path_parameters.fetch(:application_id))
        interview = application.hiring_interviews.find(request.path_parameters.fetch(:interview_id))
        feedback = current_company.hiring_feedbacks.joins(:hiring_interview_booking)
          .where(hiring_interview_bookings: { hiring_interview_id: interview.id }).find(request.path_parameters.fetch(:feedback_id))
        Hiring::FeedbackCommunication.new(feedback:, actor: current_user)
      end
    end
end
