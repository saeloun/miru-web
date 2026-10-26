# frozen_string_literal: true

class Api::V1::Hiring::AssignmentsController < Api::V1::Hiring::BaseController
  def index
    with_application do |application|
      rows, pagination = page_records(application.hiring_assignments.order(id: :desc))
      render json: { company_id: current_company.id, application_version: application.lock_version,
        application_stage: application.stage, assignments: rows.map { |record| assignment_details(record) }, pagination: }
    end
  end

  def create
    attributes = mutation_attributes(:hiring_assignment, ::Hiring::Assignments::ISSUE_KEYS)
    with_application do |application|
      assignment = service(application).issue!(attributes:)
      render json: { company_id: current_company.id, assignment: assignment_details(assignment) }, status: 201
    end
  end

  def reassign
    attributes = mutation_attributes(:hiring_assignment, %w[company_id application_version assignment_version reviewer_employment_id reason])
    with_application do |application|
      assignment = application.hiring_assignments.find(optional_id(:id))
      service(application).reassign!(assignment:, attributes:)
      render json: { company_id: current_company.id, assignment: assignment_details(assignment) }
    end
  end

  def decision
    attributes = mutation_attributes(:hiring_assignment, ::Hiring::Assignments::DECISION_KEYS)
    with_application do |application|
      assignment = application.hiring_assignments.find(optional_id(:id))
      result = service(application).decide!(assignment:, attributes:)
      render json: { company_id: current_company.id, assignment: assignment_details(result) }
    end
  end

  def download
    with_application do |application|
      assignment = application.hiring_assignments.find(optional_id(:id))
      file = service(application).admin_file!(assignment:, attachment_id: optional_id(:attachment_id))
      response.headers["Content-Security-Policy"] = "sandbox; default-src 'none'"
      send_data file.fetch(:data), filename: file.fetch(:filename), type: file.fetch(:type), disposition: "attachment"
    end
  end

  private

    def service(application) = ::Hiring::Assignments.new(application:, actor: current_user)

    def with_application
      current_user.with_lock do
        authorize_hiring
        current_company.with_lock do
          application = current_company.hiring_applications.find(optional_id(:application_id))
          application.with_lock { yield application }
        end
      end
    end

    def assignment_details(record)
      record.reload
      reviewer = record.reviewer_employment
      record.review_details.merge(ended_at: record.ended_at, previous_assignment_id: record.previous_assignment_id,
        reviewer: reviewer && { id: reviewer.id, full_name: reviewer.user.full_name },
        url: record.active? && record.due_at > Time.current ? hiring_assignment_url(anchor: record.access_token) : nil,
        events: record.events.order(id: :desc).map do |event|
          event.slice(:id, :action, :assignment_version, :created_at).merge(details: event.details)
        end)
    end
end
