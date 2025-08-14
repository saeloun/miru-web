# frozen_string_literal: true

class InternalApi::V1::ProjectMembersController < InternalApi::V1::ApplicationController
  def update
    authorize project, policy_class: ProjectMemberPolicy

    ProjectMemberService.new(update_params).process
    render json: {}, status: 200
  end

  private

    def update_params
      {
        project:,
        added_members: added_members_params[:added_members],
        updated_members: updated_members_params[:updated_members],
        removed_member_ids: removed_members_params[:removed_member_ids]
      }
    end

    def added_members_params
      params.require(:members).permit(added_members: [:id, :hourly_rate])
    end

    def updated_members_params
      params.require(:members).permit(updated_members: [:id, :hourly_rate])
    end

    def removed_members_params
      params.require(:members).permit(removed_member_ids: [])
    end

    def project
      @_project ||= Project.find_by(id: params[:id])
    end
end
