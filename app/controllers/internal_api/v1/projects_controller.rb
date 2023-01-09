# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project
    render :index, locals: ProjectsFetchService.new(current_company, params).process, status: :ok
  end

  def show
    authorize project
    render :show,
      locals: {
        project:,
        team_member_details: project.project_members_snippet(params[:time_frame]),
        total_duration: project.total_logged_duration(params[:time_frame]),
        overdue_and_outstanding_amounts: project.overdue_and_outstanding_amounts
      },
      status: :ok
  end

  def create
    authorize Project
    render :create, locals: {
      project: Project.create!(project_params)
    }
  end

  def update
    authorize project
    project.update!(project_params)
    render :update, locals: {
      project:
    }
  end

  def destroy
    authorize project
    render json: { notice: I18n.t("projects.delete.success.message") }, status: :ok if project.discard!
  end

  private

    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end

    def project_params
      params.require(:project).permit(
        policy(Project).permitted_attributes
      )
    end
end
