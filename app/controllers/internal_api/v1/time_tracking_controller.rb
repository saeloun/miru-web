# frozen_string_literal: true

# TODO: Refactoring -> can be merge with time entries controller
class InternalApi::V1::TimeTrackingController < InternalApi::V1::ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    authorize :index, policy_class: TimeTrackingPolicy
    user_id = current_user.id
    employees = is_admin ? current_company.users.select(:id, :first_name, :last_name) : [current_user]

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
    render json: { clients:, projects:, entries:, employees: }, status: :ok
  end

  private

    def is_admin
      @_is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end

    def get_clients
      if is_admin
        current_company.clients.order(name: :asc).includes(:projects)
      else
        current_user.clients
          .where(company_id: current_company.id)
          .order(name: :asc)
          .includes(:projects).distinct
      end
    end

    def get_projects(is_admin, clients)
      projects = {}
      if is_admin
        clients.map { |client| projects[client.name] = client.projects }
      else
        employee_projects = current_user.projects
        clients.map { |client| projects[client.name] = client.projects & employee_projects }
      end
      projects
    end
end
