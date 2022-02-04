# frozen_string_literal: true

class TimeTrackingController < ApplicationController
  def index
    @is_admin = current_user.has_role? :admin
    @clients = current_user.company.clients.includes(:projects)
    @projects = {}
    @clients.map do |c|
      @projects[c.name] = c.projects
    end

    timesheet_entries = current_user.timesheet_entries.where(work_date: Date.today.beginning_of_week..Date.today.end_of_week).order(work_date: :desc)
    @entries = {}
    timesheet_entries.map do |entry|
      @entries[entry.work_date] ||= []
      @entries[entry.work_date] << entry.formatted_entry
    end

    render
  end
end
