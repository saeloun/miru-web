# frozen_string_literal: true

class InternalApi::V1::ProjectMembersController < InternalApi::V1::ApplicationController
  def update
    authorize project, policy_class: ProjectMemberPolicy

    project.update!(project_params)
    render json: {}, status: :ok
  end

  private

    def project
      @_project ||= Project.find_by(id: params[:id])
    end

    def project_params
      params.require(:project).permit(
        project_members_attributes: [:id, :user_id, :hourly_rate, :_destroy]
      )
    end
end
