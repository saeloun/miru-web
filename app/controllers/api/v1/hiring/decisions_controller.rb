# frozen_string_literal: true

class Api::V1::Hiring::DecisionsController < Api::V1::Hiring::BaseController
  def index
    decisions.with_application do
      rows, pagination = page_records(application.hiring_decisions.includes(:created_by, :finalized_by).order(id: :desc))
      notices = current_company.hiring_messages.where(hiring_application: application, kind: "hold_follow_up",
        event_key: rows.map { |decision| "decision:#{decision.id}" }).order(:id).group_by(&:event_key)
      history = rows.map do |decision|
        notifications = notices.fetch("decision:#{decision.id}", []).map do |message|
          message.slice(:id, :kind, :state, :error_code, :sent_at).merge(content: message.content.slice("to", "reply_to", "subject", "body"))
        end
        decision.review_details.merge(notifications:)
      end
      render json: { company_id: current_company.id, application: application_details(application),
        time_zone: current_company.resolved_time_zone.tzinfo.name,
        current_decision_id: application.hiring_decisions.order(id: :desc).pick(:id),
        decisions: history, pagination: }
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
