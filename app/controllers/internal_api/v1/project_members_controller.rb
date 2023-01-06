# frozen_string_literal: true

class InternalApi::V1::ProjectMembersController < InternalApi::V1::ApplicationController
  def update
    authorize project, policy_class: ProjectMemberPolicy

    ActiveRecord::Base.transaction do
      add_new_members
      update_existing_members
      remove_members
    end
    render json: { message: "Team members updated successfully" }, status: :ok
  end

  private

    def add_new_members
      added_members = added_members_params[:added_members]

      return if added_members.blank?

      added_members = added_members.filter_map do |member|
        next unless member.key?("hourly_rate")

        { user_id: member["id"], project_id: params[:id], hourly_rate: member["hourly_rate"] }
      end

      ProjectMember.create!(added_members)
    end

    def update_existing_members
      updated_members = updated_members_params[:updated_members]

      return if updated_members.blank?

      updated_members.each do |member_params|
        ProjectMember
          .where(user_id: member_params["id"], project_id: params[:id])
          .update!(hourly_rate: member_params["hourly_rate"])
      end
    end

    def remove_members
      member_ids = removed_members_params[:removed_member_ids]

      return if member_ids.blank?

      debugger
      current_company.projects.find(params[:id]).project_members.where(user_id: member_ids).discard_all
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
