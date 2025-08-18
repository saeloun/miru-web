# frozen_string_literal: true

class Api::V1::TeamController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized, except: [:index]

  def index
    team_members = current_company.employments.kept.includes(:user).map do |employment|
      user = employment.user
      {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.full_name,
        email: user.email,
        role: employment.employment_type || "employee",
        status: employment.discarded? ? "archived" : "active",
        profilePicture: user.avatar_url,
        isTeamMember: true,
        employmentType: employment.employment_type || "employee",
        joinedAtDate: employment.joined_at&.to_s || employment.created_at.to_s
      }
    end

    render json: {
      combinedDetails: team_members
    }
  end

  def update
    employment = current_company.employments.kept.find_by!(user_id: params[:id])
    authorize employment, policy_class: TeamPolicy

    employment.update!(employment_params)

    render json: {
      success: true,
      message: "Team member updated successfully"
    }
  end

  def destroy
    employment = current_company.employments.kept.find_by!(user_id: params[:id])
    authorize employment, policy_class: TeamPolicy

    employment.discard!

    render json: {
      success: true,
      message: "Team member removed successfully"
    }
  end

  private

    def employment_params
      params.permit(:employment_type, :joined_at)
    end
end
