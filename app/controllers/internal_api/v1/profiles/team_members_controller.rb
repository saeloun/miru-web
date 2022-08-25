# frozen_string_literal: true

class InternalApi::V1::Profiles::TeamMembersController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Profiles::TeamMemberPolicy

    render json: {
      user: {
        id: current_user.id,
        team_member_ids: current_user.team_member_ids
      }
    }, status: :ok
  end

  def update
    authorize :update, policy_class: Profiles::TeamMemberPolicy

    if current_user.update_without_password(user_params)
      render json: { notice: "User updated" }, status: :ok
    else
      render json: { error: "Something went wrong" }, status: :unprocessable_entity
    end
  rescue Exception => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

    def user_params
      params.require(:user).permit(
        team_member_ids: []
      )
    end
end
