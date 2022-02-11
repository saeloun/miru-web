# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)
  end

  def create
    project = Project.new(project_params)

    if project.save
      redirect_to projects_path
    end
  end

  private
    def project_params
      params[:project][:client] = params[:project][:client].to_i
      params.require(:project).permit(:client_id, :name, :billable)
    end
end
