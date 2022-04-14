# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project
    render :index, locals: { projects: }, status: :ok
  end

  def show
    authorize Project
    render :show, locals: { project: }, status: :ok
  end

  def create
    authorize Project
    render :create, locals: {
      project: Project.create!(project_params),
      client: load_client(project_params[:client_id])
    }
  end

  def update
    authorize project
    project.update!(project_params)
    render :update, locals: {
      project:,
      client: load_client(project[:client_id])
    }
  end

  private

    def projects
      @_projects ||= current_company.projects.kept
    end

    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end

    def load_client(client_id)
      Client.find(client_id)
    end

    def project_params
      params.require(:project).permit(
        policy(Project).permitted_attributes
      )
    end
end
