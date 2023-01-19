# frozen_string_literal: true

class TimeTrackingIndexService
  attr_reader :current_user, :current_company
  attr_accessor :clients, :projects, :is_admin, :timesheet_entries, :employees

  def initialize(user, company)
    @current_user = user
    @current_company = company

    set_is_admin
    set_clients
    set_projects
    set_timesheet_entries
    set_employees
  end

  def process
    {
      clients:,
      projects:,
      entries: formatted_timesheet_entries,
      employees:
    }
  end

  private

    def set_employees
      @employees = is_admin ? current_company_users : [current_user]
    end

    def current_company_users
      current_company.users.with_kept_employments.select(:id, :first_name, :last_name)
    end

    def set_timesheet_entries
      @timesheet_entries = current_user
        .timesheet_entries
        .includes([:project, :user])
        .in_workspace(current_company)
        .during(
          1.month.ago.beginning_of_month,
          1.month.since.end_of_month
                            )
    end

    def formatted_timesheet_entries
      entries = TimesheetEntriesPresenter.new(timesheet_entries).group_snippets_by_work_date
      entries[:currentUserRole] = current_user.primary_role current_company
      entries
    end

    def set_is_admin
      @is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end

    def set_clients
      if is_admin
        @clients = current_company.clients.kept.order(name: :asc).includes(:projects)
      else
        @clients = current_user.clients.kept
          .where(company_id: current_company.id)
          .order(name: :asc)
          .includes(:projects).distinct
      end
    end

    def set_projects
      @projects = ClientsPresenter
        .new(clients, current_company, current_user)
        .group_projects_by_client_name
    end
end
