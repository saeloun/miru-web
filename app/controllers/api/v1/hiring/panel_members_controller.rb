# frozen_string_literal: true

class Api::V1::Hiring::PanelMembersController < Api::V1::Hiring::BaseController
  rescue_from ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique, ActiveRecord::SerializationTypeMismatch do
    render json: { errors: "Choose an active staff member, valid panel details and a safe HTTPS booking link." }, status: 422
  end

  def index
    current_user.with_lock do
      authorize_hiring
      relation = current_company.hiring_panel_members.joins(employment: :user).includes(employment: :user)
      query = query_text
      if query.present?
        term = "%#{Employment.sanitize_sql_like(query)}%"
        relation = relation.where("concat_ws(' ', users.first_name, users.last_name) ILIKE ?", term)
      end
      rows, pagination = page_records(relation.order(:id))
      active_ids = HiringPolicy.staff_members(current_company).where(id: rows.map(&:employment_id)).pluck(:id)
      render json: { company_id: current_company.id, panel_members: rows.map { |member| member_details(member, active_ids.include?(member.employment_id)) }, pagination: }
    end
  end

  def search
    load_search([])
    index
  end

  def create
    attributes = mutation_attributes(:hiring_panel_member, %w[company_id employment_id details])
    value = attributes["employment_id"]
    unless (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)
      raise ::Hiring::Intake::InvalidInput, "Choose an active staff member."
    end
    with_panel_write do
      member = current_company.hiring_panel_members.create!(employment: HiringPolicy.staff_members(current_company).find_by(id: value),
        details: profile_details(attributes))
      render json: { company_id: current_company.id, panel_member: member_details(member, true) }, status: 201
    end
  end

  def update
    attributes = mutation_attributes(:hiring_panel_member, %w[company_id lock_version details])
    with_panel_write do
      member = current_company.hiring_panel_members.find(optional_id(:id))
      member.with_lock do
        version = attributes["lock_version"]
        unless version.is_a?(Integer) && version >= 0 && version == member.lock_version
          raise ::Hiring::Intake::Conflict, "This panel profile changed. Reload before saving."
        end
        member.update!(details: profile_details(attributes))
        render json: { company_id: current_company.id, panel_member: member_details(member, member.active?) }
      end
    end
  end

  private

    def with_panel_write(&operation)
      current_user.with_lock do
        authorize_hiring
        current_company.with_lock("FOR NO KEY UPDATE", &operation)
      end
    end

    def profile_details(attributes)
      value = attributes["details"]
      raise ::Hiring::Intake::InvalidInput, "Use valid panel details." unless value.is_a?(Hash)

      value
    end

    def member_details(member, active)
      { id: member.id, employment_id: member.employment_id, full_name: member.employment.user.full_name,
        details: member.details, lock_version: member.lock_version, active: }
    end
end
