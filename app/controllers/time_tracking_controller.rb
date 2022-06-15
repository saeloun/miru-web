# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    is_admin = current_user.has_role?(:owner, current_company) || current_user.has_role?(:admin, current_company)
    user_id = current_user.id
    employees = is_admin ? current_company.users.select(:id, :first_name, :last_name) : [current_user]

    clients = current_company.clients.includes(:projects)
    projects = {}
    clients.map { |client| projects[client.name] = client.projects }

    timesheet_entries = current_user
      .timesheet_entries
      .includes([:project, :user])
      .in_workspace(current_company)
      .during(
        1.month.ago.beginning_of_month,
        1.month.since.end_of_month
        )
    entries = formatted_entries_by_date(timesheet_entries)
    render :index, locals: { is_admin:, clients:, projects:, entries:, employees:, user_id: }
  end
end
