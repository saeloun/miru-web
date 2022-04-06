# frozen_string_literal: true

class InternalApi::V1::ProjectsController < InternalApi::V1::ApplicationController
  def index
    authorize Project
    render :index, locals: { projects: }, status: :ok
  end

  def show
    authorize Project
    render :show, locals: { project: }, status: :ok
  end

  def update_members
    authorize Project

    ActiveRecord::Base.transaction do
      add_new_members
      update_existing_members
      remove_members
    end
    render json: {
      notice: I18n.t("projects.update_members.success.message")
    }, status: :ok
    rescue Exception => ex
      render json: {
        data: ex.message,
        notice: I18n.t("projects.update_members.failure.message")
      }, status: :bad_request
  end

  private

    def projects
      @_projects ||= current_company.projects.kept
    end

    def projects
      @_projects ||= current_company.projects.kept
    end

    def project
      @_project ||= Project.includes(:project_members, project_members: [:user]).find(params[:id])
    end

    def add_new_members
      ProjectMember.create!(added_members_params)
    end

    def update_existing_members
      updated_members_params
        .each { |member_params|
  ProjectMember
    .where(user_id: member_params["id"], project_id: params[:id])
    .update!(hourly_rate: member_params["hourlyRate"])
}
    end

    def remove_members
      member_ids = removed_members_params

      if !member_ids.empty?
        project.project_members.where(user_id: member_ids).delete_all
      end
    end

    def added_members_params
      params.require(:members).permit(added_members: [:id, :hourlyRate])["added_members"]
        .map { |m| { user_id: m["id"], project_id: params[:id], hourly_rate: m["hourlyRate"] } }
    end

    def updated_members_params
      params.require(:members).permit(updated_members: [:id, :hourlyRate])["updated_members"]
    end

    def removed_members_params
      params.require(:members).permit(removed_member_ids: [])["removed_member_ids"]
    end
end
