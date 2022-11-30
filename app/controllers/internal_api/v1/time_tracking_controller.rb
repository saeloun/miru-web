# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    user_id = current_user.id
    employees = is_admin ? current_company.users.kept.order(first_name: :asc).select(
      :id, :first_name,
      :last_name) : [current_user]

    clients = get_clients
    projects = get_projects(is_admin, clients)

    timesheet_entries = current_user
      .timesheet_entries
      .includes([:project, :user])
      .in_workspace(current_company)
      .during(
        1.month.ago.beginning_of_month,
        1.month.since.end_of_month
        )
    entries = formatted_entries_by_date(timesheet_entries)
    render json: { projects:, entries:, employees: }, status: :ok
  end

  private

    def is_admin
      @_is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end

    def get_clients
      if is_admin
        current_company.clients.kept.order(name: :asc).includes(:projects)
      else
        current_user.clients.kept
          .where(company_id: current_company.id)
          .order(name: :asc)
          .includes(:projects).distinct
      end
    end

    def get_projects(is_admin, clients)
      if is_admin
        clients.map { |client| client.projects.kept }.flatten
      else
        employee_projects = current_user.projects.kept.joins(:client).where(clients: { company_id: current_company.id })
        clients.map { |client| client.projects.kept & employee_projects }.flatten
      end
    end
end
