# frozen_string_literal: true

class Api::V1::Hiring::InterviewFeedbackController < Api::V1::Hiring::BaseController
  def index
    current_user.with_lock do
      authorize_hiring
      relation = HiringFeedback.assigned_to(current_user, current_company).collectible.where(submitted_at: nil)
        .where("hiring_interview_bookings.starts_at <= ?", Time.current)
      rows, pagination = page_records(relation.order("hiring_interview_bookings.feedback_due_at", :id))
      render json: { company_id: current_company.id, feedbacks: rows.filter_map do |record|
        next unless HiringFeedbackPolicy.new(current_user, record).show?

        record.review_details.merge(candidate_name: record.hiring_interview_booking.hiring_interview.hiring_application.submitted_name)
      end, pagination: }
    end
  end

  def show
    render json: submission.details
  end

  def update
    attributes = mutation_attributes(:hiring_feedback, Hiring::FeedbackSubmission::KEYS)
    render json: submission.submit!(attributes:)
  end

  private

    def submission
      record = current_company.hiring_feedbacks.find(optional_id(:id))
      Hiring::FeedbackSubmission.new(feedback: record, actor: current_user)
    end

    def authorize_hiring
      raise Pundit::NotAuthorizedError unless current_company.id == current_user.current_workspace_id

      authorize HiringFeedback, :index?, policy_class: HiringFeedbackPolicy
    end
end
