# frozen_string_literal: true

class Api::V1::Hiring::RolesController < Api::V1::Hiring::BaseController
  def index
    records = current_company.hiring_roles
    query = query_text
    records = records.where("title ILIKE ?", "%#{HiringRole.sanitize_sql_like(query)}%") if query.present?
    if search_filters[:status]
      raise ActionController::BadRequest unless %w[open closed].include?(search_filters[:status])

      records = records.where(status: search_filters[:status])
    end
    rows, pagination = page_records(records.order(:title, :id))
    render json: { company_id: current_company.id, roles: rows.map { |role| role.slice(:id, :title, :status, :lock_version) }, pagination: }
  end

  def search
    load_search(%w[status])
    index
  end

  def create
    attributes = mutation_attributes(:role, %w[company_id title])
    raise ::Hiring::Intake::InvalidInput, "Enter a role title." unless attributes["title"].is_a?(String)

    role = current_user.with_lock do
      authorize_hiring
      current_company.hiring_roles.create!(title: attributes["title"])
    end
    render json: { company_id: current_company.id, role: role.slice(:id, :title, :status, :lock_version) }, status: 201
  end

  def update
    attributes = mutation_attributes(:role, %w[company_id title status lock_version])
    values = attributes.slice("title", "status")
    unless values.values.all? { |value| value.is_a?(String) } &&
        attributes["lock_version"].is_a?(Integer) && attributes["lock_version"] >= 0
      raise ::Hiring::Intake::InvalidInput, "Enter valid role details and reload before saving."
    end
    role = current_company.hiring_roles.find(optional_id(:id))
    current_user.with_lock do
      authorize_hiring
      role.with_lock do
        authorize role, :update?, policy_class: HiringPolicy
        raise ActiveRecord::StaleObjectError.new(role, "update") unless role.lock_version == attributes["lock_version"]

        role.update!(values)
      end
    end
    render json: { company_id: current_company.id, role: role.slice(:id, :title, :status, :lock_version) }
  end
end
