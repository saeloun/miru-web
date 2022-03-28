# frozen_string_literal: true

class ProjectsController < ApplicationController
  skip_after_action :verify_authorized

  def index
    authorize Project
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

  private

    def project_params
      params.require(:project).permit(:client_id, :name, :billable)
    end
end
