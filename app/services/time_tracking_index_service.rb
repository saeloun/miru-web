# frozen_string_literal: true

class TimeTrackingIndexService
  attr_reader :current_user, :user, :current_company, :entries, :from, :to, :year
  attr_accessor :clients, :projects, :is_admin, :employees

  def initialize(current_user:, user:, company:, from:, to:, year:)
    @current_user = current_user
    @user = user
    @current_company = company
    @from = from
    @to = to
    @year = year
    @entries = {}
    setup_data
  end

  def process
    {
      clients:,
      projects:,
      entries: format_entries,
      employees:,
      leave_types:,
      holiday_infos:
    }
  end

  private

    def setup_data
      set_is_admin
      set_clients
      set_projects
      set_employees
    end

    def set_employees
      @employees = is_admin ? current_company_users : [current_user]
    end

    def current_company_users
      current_company.employees_without_client_role.select(:id, :first_name, :last_name)
    end

    def format_entries
      formatted_timesheet_entries
      group_timeoff_entries_by_leave_date
      entries
    end

    def fetch_timesheet_entries
      user.timesheet_entries.kept.includes([:project, :user])
        .in_workspace(current_company)
        .during(from, to)
    end

    def formatted_timesheet_entries
      timesheet_entries = fetch_timesheet_entries
      @entries = TimesheetEntriesPresenter.new(timesheet_entries).group_snippets_by_work_date
    end

    def set_is_admin
      @is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    end

    def set_clients
      @clients = ClientPolicy::Scope.new(current_user, current_company).resolve.includes(:projects, :addresses)
    end

    def set_projects
      @projects = {}
      user_projects = ProjectPolicy::Scope.new(current_user, current_company).resolve
      clients.each { |client| @projects[client.name] = client.projects.kept & user_projects }
    end

    def timeoff_entries
      @_timeoff_entries ||= current_company.timeoff_entries.kept.includes([:leave_type])
        .where(user_id: user.id)
        .order(leave_date: :desc)
        .during(
          from,
          to
        )
    end

    def group_timeoff_entries_by_leave_date
      timeoff_entries.each do |entry|
        @entries[entry.leave_date] ||= []
        @entries[entry.leave_date] << entry
      end
    end

    def leave_types
      leave = current_company.leaves.find_by(year:)
      leave&.leave_types&.kept || []
    end

    def holiday_infos
      holiday = current_company.holidays.find_by(year:)
      all_holidays = holiday&.holiday_infos&.kept
      return [] if holiday.blank? || all_holidays.blank?

      holiday.enable_optional_holidays ? all_holidays : all_holidays.national
    end
end
