# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)

    @new_project = Project.new
    @timesheet_entries = TimesheetEntry.new
    @clients = Client.select("name")
  end

  def create
  end
end
