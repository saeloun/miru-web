# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project

    render json: { projects: projects }, status: :ok
  end

  def show
    authorize Project

    render json: { project: project }, status: :ok
  end

  private
    def projects
      projects = current_user.current_workspace.projects
      projects.kept.map { | project |
                            { id: project.id,
                              name: project.name,
                              clientName: project.client.name,
                              isBillable: project.billable,
                              minutesSpent: project.total_hours_logged } }
    end

    def project
      project = Project.find(params[:id])
      project_members = project.project_member_details.map { | member |
                          { name: member[:name],
                           hourlyRate: member[:hourly_rate],
                           minutesSpent: member[:minutes_spent],
                           cost: member[:hourly_rate] * member[:minutes_spent] / 60 }}
      { id: project.id,
        name: project.name,
        clientName: project.client.name,
        isBillable: project.billable,
        minutesSpent: project.total_hours_logged,
        projectMembers:  project_members }
    end
end
