# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    is_admin = current_user.is_admin?
    clients = current_company.clients.includes(:projects)
    projects = {}
    clients.map { |client| projects[client.name] = client.projects }

    timesheet_entries = current_user.timesheet_entries.in_workspace(current_company).during(
      Date.today.beginning_of_week,
      Date.today.end_of_week
    )
    entries = formatted_entries_by_date(timesheet_entries)

    render :index, locals: { is_admin:, clients:, projects:, entries: }
  end
end
