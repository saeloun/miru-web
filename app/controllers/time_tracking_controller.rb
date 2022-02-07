# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  include Timesheet

  def index
    @is_admin = current_user.is_admin?
    @clients = current_company.clients.includes(:projects)
    @projects = {}
    @clients.map do |c|
      @projects[c.name] = c.projects
    end

    timesheet_entries = current_user.timesheet_entries.during(
      Date.today.beginning_of_week,
      Date.today.end_of_week
    )
    @entries = formatted_entries_by_date(timesheet_entries)
  end
end
