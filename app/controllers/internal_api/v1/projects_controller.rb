# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project
    render :index, locals: { projects: }, status: :ok
  end

  def show
    authorize Project
    render :show, locals: { project: project }, status: :ok
  end

  private
    def projects
      @_projects ||= current_company.projects.kept
    end

    def projects
      @_projects ||= current_company.projects.kept
    end

    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end
end
