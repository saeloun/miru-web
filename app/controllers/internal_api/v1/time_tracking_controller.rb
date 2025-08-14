# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized
  before_action :set_user, only: [:index]

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    year = params[:year] || Date.today.year
    from = params[:from] || 1.month.ago.beginning_of_month
    to = params[:to] || 1.month.since.end_of_month

    # Fetch data directly
    entries = @user.timesheet_entries
      .joins(project: :client)
      .where(work_date: from..to)
      .kept
      .includes(project: :client)
      .order(work_date: :desc)

    # Filter projects based on user role
    if @user.has_role?(:admin, current_company) || @user.has_role?(:owner, current_company)
      # Admin/owner sees all projects
      all_projects = current_company.projects.kept.includes(:client).order(:name)
      clients = current_company.clients.kept.order(:name)
    else
      # Employee only sees their assigned projects in the current company
      project_ids = @user.project_members
        .joins(project: :client)
        .where(projects: { discarded_at: nil }, clients: { company_id: current_company.id })
        .pluck(:project_id)
      all_projects = current_company.projects.kept.includes(:client).where(id: project_ids).order(:name)
      client_ids = all_projects.map(&:client_id).uniq
      clients = current_company.clients.kept.where(id: client_ids).order(:name)
    end

    projects_by_client = all_projects.group_by { |p| p.client.name }
    # Transform projects into expected format
    projects_data = projects_by_client.transform_values do |client_projects|
      client_projects.map do |project|
        {
          id: project.id,
          name: project.name,
          billable: project.billable,
          description: project.description,
          client_id: project.client_id
        }
      end
    end
    employees = current_company.employees_without_client_role

    # Get holiday infos for the year
    holiday_infos = current_company.holiday_infos
      .joins(:holiday)
      .where(holidays: { year: year })
      .order(:date)

    # Get leave types for the year
    leave = current_company.leaves.find_or_create_by!(year: year)
    leave_types = leave.leave_types.order(:name)

    render :index, locals: {
      clients: clients,
      employees: employees,
      entries: entries,
      holiday_infos: holiday_infos,
      leave_types: leave_types,
      projects: projects_data,
      company: current_company
    }, status: 200
  end

  private

    def set_user
      user_id = params[:user_id] || current_user.id
      @user = current_company.users.find(user_id)
    end
end
