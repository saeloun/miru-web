# frozen_string_literal: true

class Api::V1::Hiring::ApplicationsController < Api::V1::Hiring::BaseController
  def index
    records = filtered_applications
    rows, pagination = page_records(records.order(received_at: :desc, id: :desc))
    render json: { company_id: current_company.id, applications: rows.map { |record| application_details(record) },
      pagination:, stages: HiringApplication::STAGES.index_with(&:humanize), time_zone: company_time_zone.tzinfo.name }
  end

  def search
    load_search(%w[stage role_id owner_employment_id from to])
    index
  end

  def search_owners
    load_search(%w[include_history])
    owners
  end

  def create
    # Intake validates unknown fields as well as scalar types before persistence.
    value = params.require(:application)
    raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters)

    record = ::Hiring::Intake.new(company: current_company, actor: current_user, attributes: value.to_unsafe_h).process
    render json: { company_id: current_company.id, application: application_details(record) },
      status: record.previously_new_record? ? 201 : 200
  end

  def show
    record = company_applications.find(optional_id(:id))
    history, pagination = page_records(company_applications.where(hiring_candidate_id: record.hiring_candidate_id)
      .order(received_at: :desc, id: :desc))
    render json: { company_id: current_company.id, application: application_details(record).merge(notes: record.notes,
      submitted_email: record.creation_details["email"]), history: history.map { |item| application_details(item) },
      pagination:, time_zone: company_time_zone.tzinfo.name }
  end

  def owners
    active_members = HiringPolicy.staff_members(current_company)
    include_history = search_filters[:include_history]
    raise ActionController::BadRequest unless include_history.nil? || [true, false].include?(include_history)

    members = active_members
    if include_history
      company_members = current_company.employments.joins(:user)
      members = company_members.where(id: active_members.select(:id))
        .or(company_members.where(id: current_company.hiring_applications.select(:owner_employment_id)))
    end
    members = members.includes(:user)
    query = query_text
    if query.present?
      term = "%#{Employment.sanitize_sql_like(query)}%"
      members = members.where("concat_ws(' ', users.first_name, users.last_name) ILIKE :term OR employments.employee_id ILIKE :term", term:)
    end
    rows, pagination = page_records(members.order("users.first_name", "users.last_name", "employments.id"))
    active_ids = active_members.where(id: rows.map(&:id)).pluck(:id)
    render json: { company_id: current_company.id, owners: rows.map do |member|
      { id: member.id, full_name: member.user.full_name, employee_id: member.employee_id, active: active_ids.include?(member.id) }
    end, pagination: }
  end

  private

    def company_applications
      current_company.hiring_applications.includes(:hiring_candidate, :hiring_role, owner_employment: :user)
    end

    def filtered_applications
      records = company_applications.joins(:hiring_candidate)
      query = query_text
      if query.present?
        term = "%#{HiringCandidate.sanitize_sql_like(query)}%"
        records = records.where("hiring_candidates.full_name ILIKE :term OR hiring_candidates.email ILIKE :term", term:)
      end
      role_id, owner_id = optional_id(:role_id), optional_id(:owner_employment_id)
      records = records.where(hiring_role_id: role_id) if role_id
      records = records.where(owner_employment_id: owner_id) if owner_id
      if search_filters[:stage]
        raise ActionController::BadRequest unless HiringApplication::STAGES.include?(search_filters[:stage])

        records = records.where(stage: search_filters[:stage])
      end
      from, to = filter_date(:from), filter_date(:to)
      raise ActionController::BadRequest if from && to && from > to

      records = records.where("hiring_applications.received_at >= ?", from.in_time_zone(company_time_zone)) if from
      records = records.where("hiring_applications.received_at < ?", to.next_day.in_time_zone(company_time_zone)) if to
      records
    end

    def filter_date(key)
      value = search_filters[key]
      return nil if value.nil?
      raise ActionController::BadRequest unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      Date.iso8601(value)
    rescue Date::Error
      raise ActionController::BadRequest
    end
end
