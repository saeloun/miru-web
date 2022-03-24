# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def show
    authorize Project
    render :show, locals: { project: project }, status: :ok
  end

  private
    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end
end
