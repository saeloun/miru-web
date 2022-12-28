# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project
    render :index, locals: { current_company:, current_company_clients:, current_company_users: }, status: :ok
  end

  def show
    authorize project
    render :show,
      locals: {
        project:,
        team_member_details: project.project_team_member_details(params[:time_frame]),
        total_duration: project.project_total_logged_duration(params[:time_frame]),
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

    def current_company_clients
      @_current_company_clients ||= current_company.clients.kept
    end

    def current_company_users
      @_current_company_users ||= current_company.employments.joins(:user)
        .select("users.id as id, users.first_name as first_name, users.last_name as last_name")
    end

    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end

    def project_params
      params.require(:project).permit(
        policy(Project).permitted_attributes
      )
    end
end
