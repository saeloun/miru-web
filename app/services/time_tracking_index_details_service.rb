# frozen_string_literal: true

class TimeTrackingIndexDetailsService
  attr_reader :current_user, :current_company
  attr_accessor :clients, :projects, :is_admin, :timesheet_entries, :employees

  def initialize(user, company)
    @current_user = user
    @current_company = company
    @is_admin = is_current_user_admin
    @clients = get_clients
    @projects = get_projects
    @timesheet_entries = get_timesheet_entries
    @employees = get_employees
  end

  def process
    {
      clients:,
      projects:,
      timesheet_entries:,
      employees:
    }
  end

  private

    def get_employees
      is_admin ? current_company.users.select(:id, :first_name, :last_name) : [current_user]
    end

    def get_timesheet_entries
      current_user
        .timesheet_entries
        .includes([:project, :user])
        .in_workspace(current_company)
        .during(
          1.month.ago.beginning_of_month,
          1.month.since.end_of_month
        )
    end

    def is_current_user_admin
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

    def get_projects
      projects = {}
      if is_admin
        clients.each { |client| projects[client.name] = client.projects.kept }
      else
        employee_projects = current_user.projects.kept.joins(:client).where(clients: { company_id: current_company.id })
        clients.each { |client| projects[client.name] = client.projects.kept & employee_projects }
      end
      projects
    end
end
