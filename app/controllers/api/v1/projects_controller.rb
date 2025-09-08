# frozen_string_literal: true

class Api::V1::ProjectsController < Api::V1::ApplicationController
  def index
    authorize Project

    # Search projects using ransack or pg_search
    projects = if params[:search_term].present?
      current_company.projects.kept.search(params[:search_term])
    else
      current_company.projects.kept
    end

    projects = projects.includes(:client, :timesheet_entries, project_members: :user)
    clients = current_company.clients.kept

    render :index, locals: {
      projects: projects,
      clients: clients
    }, status: 200
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
      status: 200
  end

  def create
    authorize Project
    render :create, locals: {
      project: Project.create!(project_params),
      notice: I18n.t("projects.create.success")
    }
  end

  def update
    authorize project
    project.update!(project_params)
    render :update, locals: {
      project:,
      notice: I18n.t("projects.update.success")
    }
  end

  def destroy
    authorize project
    render json: { notice: I18n.t("projects.delete.success.message") }, status: 200 if project.discard!
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
