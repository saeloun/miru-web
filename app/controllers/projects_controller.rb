# frozen_string_literal: true

class ProjectsController < ApplicationController
  def index
    @query = Project.ransack(params[:q])
    @projects = @query.result(distinct: true)
  end

  def create
    project = Project.new(project_params)

    if project.save
      flash[:notice] = t("project.create.success")
    else
      flash[:alert] = t("project.create.failure")
    end

    redirect_to projects_path
  end

  private
    def project_params
      params.require(:project).permit(:client_id, :name, :billable)
    end
end
