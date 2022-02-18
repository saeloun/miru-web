# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)
  end

  def create
    project = Project.new(project_params)

    if project.save
      flash[:notice] = t(".success")
    else
      flash[:alert] = t(".failure")
    end

    redirect_to projects_path
  end

  def show
  end

  private
    def project_params
      params.require(:project).permit(:client_id, :name, :billable)
    end
end
