# frozen_string_literal: true

class Api::V1::Hiring::AssignmentTemplatesController < Api::V1::Hiring::BaseController
  def index
    records = current_company.hiring_assignment_templates.includes(:hiring_role)
    query = query_text
    if query.present?
      pattern = "%#{HiringAssignmentTemplate.sanitize_sql_like(query)}%"
      records = records.where("title ILIKE :query OR skills ILIKE :query OR experience ILIKE :query", query: pattern)
    end
    records = records.where(hiring_role_id: optional_id(:role_id)) unless search_filters[:role_id].nil?
    unless search_filters[:status].nil?
      raise ActionController::BadRequest unless %w[draft approved archived].include?(search_filters[:status])

      records = records.where(status: search_filters[:status])
    end
    rows, pagination = page_records(records.order(:title, :id))
    render json: { company_id: current_company.id, templates: rows.map(&:summary_details), pagination: }
  end

  def search
    load_search(%w[role_id status])
    index
  end

  def show
    template = current_company.hiring_assignment_templates.find(optional_id(:id))
    rows, pagination = page_records(template.revisions.order(template_version: :desc))
    render json: { company_id: current_company.id, template: template.review_details,
      revisions: rows.map(&:review_details), pagination: }
  end

  def create
    save_template
  end

  def update
    save_template
  end

  def approve
    save_template("approve")
  end

  def archive
    save_template("archive")
  end

  private

    def save_template(action = "save")
      create = action_name == "create"
      keys = action == "save" ? ::Hiring::AssignmentTemplates::KEYS : %w[company_id lock_version]
      attributes = mutation_attributes(:hiring_assignment_template, keys)
      template = current_company.hiring_assignment_templates.find(optional_id(:id)) unless create
      template = ::Hiring::AssignmentTemplates.new(company: current_company, actor: current_user, attributes:).process(template:, action:)
      render json: { company_id: current_company.id, template: template.review_details }, status: create ? 201 : 200
    end
end
