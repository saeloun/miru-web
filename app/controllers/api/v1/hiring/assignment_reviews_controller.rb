# frozen_string_literal: true

class Api::V1::Hiring::AssignmentReviewsController < Api::V1::Hiring::BaseController
  def index
    current_user.with_lock do
      authorize_hiring
      current_company.with_lock do
        reviewers = HiringPolicy.staff_members(current_company).where(user_id: current_user.id).select(:id)
        relation = current_company.hiring_assignments.where(reviewer_employment_id: reviewers, ended_at: nil).
          joins(:hiring_application).where(hiring_applications: { stage: HiringAssignment::ACTIVE_STAGES }).order(id: :desc)
        rows, pagination = page_records(relation)
        render json: { company_id: current_company.id, assignments: rows.map do |record|
          { id: record.id, title: record.terms.fetch("title"), candidate_name: record.hiring_application.submitted_name,
            role: record.terms["role"]&.fetch("title"), status: record.status, due_at: record.due_at }
        end, pagination: }
      end
    end
  end

  def show
    with_assignment { |assignment| render json: { company_id: current_company.id, assignment: assignment.review_details } }
  end

  def create
    attributes = mutation_attributes(:hiring_assignment, ::Hiring::Assignments::REVIEW_KEYS)
    with_assignment do |assignment|
      service(assignment).review!(assignment:, attributes:)
      render json: { company_id: current_company.id, assignment: assignment.reload.review_details }
    end
  end

  def download
    with_assignment do |assignment|
      file = service(assignment).reviewer_file!(assignment:, attachment_id: optional_id(:attachment_id))
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data file.fetch(:data), filename: file.fetch(:filename), type: file.fetch(:type), disposition: "attachment"
    end
  end

  private

    def authorize_hiring
      raise Pundit::NotAuthorizedError unless current_company.id == current_user.current_workspace_id

      authorize HiringAssignment, :index?
    end

    def service(assignment) = ::Hiring::Assignments.new(application: assignment.hiring_application, actor: current_user)

    def with_assignment
      current_user.with_lock do
        authorize_hiring
        current_company.with_lock do
          assignment = current_company.hiring_assignments.find(optional_id(:id))
          assignment.hiring_application.with_lock do
            assignment.with_lock do
              authorize assignment, :show?
              yield assignment
            end
          end
        end
      end
    end
end
