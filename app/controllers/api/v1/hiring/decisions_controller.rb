# frozen_string_literal: true

class Api::V1::Hiring::DecisionsController < Api::V1::Hiring::BaseController
  def index
    decisions.with_application do
      rows, pagination = page_records(application.hiring_decisions.includes(:created_by, :finalized_by).order(id: :desc))
      render json: { company_id: current_company.id, application: application_details(application),
        time_zone: current_company.resolved_time_zone.tzinfo.name,
        current_decision_id: application.hiring_decisions.order(id: :desc).pick(:id),
        decisions: rows.map(&:review_details), pagination: }
    end
  end

  def create
    decision, created = decisions.create!(attributes: mutation_attributes(:hiring_decision, Hiring::Decisions::CREATE_KEYS))
    render_decision(decision, status: created ? 201 : 200)
  end

  def update
    decision = decisions.update!(decision: application.hiring_decisions.find(optional_id(:id)),
      attributes: mutation_attributes(:hiring_decision, Hiring::Decisions::UPDATE_KEYS))
    render_decision(decision)
  end

  def finalize
    decision = decisions.finalize!(decision: application.hiring_decisions.find(optional_id(:id)),
      attributes: mutation_attributes(:hiring_decision, Hiring::Decisions::FINALIZE_KEYS))
    render_decision(decision)
  end

  private

    def application = @application ||= current_company.hiring_applications.find(optional_id(:application_id))

    def decisions = @decisions ||= Hiring::Decisions.new(application:, actor: current_user)

    def render_decision(decision, status: 200)
      render json: { company_id: current_company.id, application: application_details(application), decision: decision.review_details }, status:
    end
end
