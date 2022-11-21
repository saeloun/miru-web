# frozen_string_literal: true

class InternalApi::V1::ProjectMembersController < InternalApi::V1::ApplicationController
  def update
    authorize project, policy_class: ProjectMemberPolicy

    ActiveRecord::Base.transaction do
      add_new_members
      update_existing_members
      remove_members
    end
    render json: {}, status: :ok
  end

  private
    def add_new_members
      added_members = added_members_params

      return if added_members.blank?

      added_members = added_members.filter_map do |m|
        next unless m.key?("hourlyRate")

        { user_id: m["id"], project_id: params[:id], hourly_rate: m["hourlyRate"] }
      end

      ProjectMember.create!(added_members)
    end

    def update_existing_members
      updated_members = updated_members_params

      return if updated_members.blank?

      updated_members.each do |member_params|
          ProjectMember
            .where(user_id: member_params["id"], project_id: params[:id])
            .update!(hourly_rate: member_params["hourlyRate"])
        end
    end

    def remove_members
      member_ids = removed_members_params

      return if member_ids.blank?

      member_ids.each do |member_id|
          ProjectMember.where(user_id: member_id, project_id: params[:id])
            .delete_all # FIXME: Use Soft delete
        end
    end

    def added_members_params
      params.require(:members).permit(added_members: [:id, :hourlyRate])["added_members"]
    end

    def updated_members_params
      params.require(:members).permit(updated_members: [:id, :hourlyRate])["updated_members"]
    end

    def removed_members_params
      params.require(:members).permit(removed_member_ids: [])["removed_member_ids"]
    end

    def project
      @_project ||= Project.find_by(id: params[:id])
    end
end
