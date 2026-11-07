# frozen_string_literal: true

class Api::V1::Hiring::InterviewReviewsController < Api::V1::Hiring::BaseController
  def index
    current_user.with_lock do
      authorize_hiring
      staff_ids = HiringPolicy.staff_members(current_company).where(user_id: current_user.id).select(:id)
      grants = HiringAccessGrant.active.where(company: current_company).joins(:hiring_panel_member)
        .where(hiring_panel_members: { employment_id: staff_ids }).select(:hiring_interview_id)
      relation = current_company.hiring_interviews.where(id: grants, status: "planned").joins(:hiring_application)
        .where(hiring_applications: { stage: "interview" }).includes(hiring_application: :hiring_candidate)
      rows, pagination = page_records(relation.order(id: :desc))
      render json: { company_id: current_company.id, interviews: rows.map do |record|
        { id: record.id, candidate_name: record.hiring_application.submitted_name, title: record.details.fetch("title"),
          kind: record.details.fetch("kind"), duration_minutes: record.details.fetch("duration_minutes"), status: record.status }
      end, pagination: }
    end
  end

  def show
    with_interview do |interview|
      render json: { company_id: current_company.id, interview: {
        id: interview.id, number: interview.number, status: interview.status, details: interview.details,
        panel: interview.panel_snapshot.map { |member| member.slice("full_name", "details") }
      },
        handover: ::Hiring::InterviewHandover.new(interview:, actor: current_user).call }
    end
  end

  def resume
    submission = with_interview { |interview| resume_submission(interview) }
    blob_id = submission.resume_attachment.blob_id
    data = submission.resume_bytes
    with_interview do |interview|
      current = resume_submission(interview)
      unless current.id == submission.id && current.resume_attachment.blob_id == blob_id
        raise ActiveStorage::FileNotFoundError
      end
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data data, filename: submission.resume.filename.to_s, type: submission.resume.blob.content_type, disposition: "attachment"
    end
  end

  def download
    attachment = with_interview { |interview| assessment_file(interview) }
    blob_id = attachment.blob_id
    data = attachment.record.file_bytes(attachment)
    with_interview do |interview|
      current = assessment_file(interview)
      raise ActiveStorage::FileNotFoundError unless current.id == attachment.id && current.blob_id == blob_id

      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data data, filename: attachment.filename.to_s, type: "application/octet-stream", disposition: "attachment"
    end
  end

  private

    def authorize_hiring
      raise Pundit::NotAuthorizedError unless current_user.current_workspace_id == current_company.id

      authorize HiringInterview, :index?, policy_class: HiringInterviewPolicy
    end

    def with_interview
      current_user.with_lock do
        authorize_hiring
        interview = current_company.hiring_interviews.find(optional_id(:id))
        interview.hiring_application.with_lock do
          interview.with_lock do
            authorize interview, :show?, policy_class: HiringInterviewPolicy
            yield interview
          end
        end
      end
    end

    def resume_submission(interview)
      submission = interview.hiring_application.hiring_submissions.where.not(submitted_at: nil).order(id: :desc).first
      raise ActiveStorage::FileNotFoundError unless submission&.review_details&.fetch(:resume)

      submission
    end

    def assessment_file(interview)
      assignment = interview.hiring_application.hiring_assignments.joins(:submission)
        .where.not(hiring_assignment_submissions: { submitted_at: nil }).order(id: :desc).first
      raise ActiveStorage::FileNotFoundError unless assignment&.id == optional_id(:assignment_id)

      assignment.submission.files_attachments.includes(:blob).find(optional_id(:attachment_id))
    end
end
