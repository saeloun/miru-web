# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize :project

    render json: { projects: projects }, status: :ok
  end

  def projects
    projects = current_user.current_workspace.projects
    projects.kept.map { | project | { id: project.id, name: project.name,  minutes_spent: project.total_hours_logged } }
  end
end
