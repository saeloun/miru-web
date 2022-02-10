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

  def create
    client_id = params[:project][:client].to_i
    name = params[:project][:name]
    billable = params[:project][:billable]
    project = Project.create!(client_id: client_id, name: name, billable: billable)

    if project.valid?
      redirect_to projects_path
    end
  end
end
