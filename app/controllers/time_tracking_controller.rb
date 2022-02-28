# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  include Timesheet
  skip_after_action :verify_authorized

  def index
    @is_admin = current_user.has_owner_or_admin_role?(current_company)
    @clients = current_company.clients.includes(:projects)
    @projects = {}
    @clients.map do |c|
      @projects[c.name] = c.projects
    end

    timesheet_entries = current_user.timesheet_entries.company_based(current_company).during(
      Date.today.beginning_of_week,
      Date.today.end_of_week
    )
    @entries = formatted_entries_by_date(timesheet_entries)
  end
end
