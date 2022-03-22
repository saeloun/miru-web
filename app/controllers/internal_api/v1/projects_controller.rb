# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def show
    authorize Project
    project_details = id: project.id, name: project.name, billable_status: project.billable
    project_team_member_details = project.project_team_member_details(params[:time_frame])
    project_total_minutes_logged = (project_team_member_details.map { |user_details| user_details[:minutes_logged] }).sum
    render json: { project_details: project_details, project_team_member_details: project_team_member_details, project_total_minutes_logged: project_total_minutes_logged }, status: :ok
  end

  private
    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end
end
