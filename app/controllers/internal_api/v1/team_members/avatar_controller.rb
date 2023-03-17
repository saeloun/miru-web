# frozen_string_literal: true

class InternalApi::V1::TeamMembers::AvatarController < InternalApi::V1::ApplicationController
  def update
    authorize user, policy_class: TeamMembers::AvatarPolicy

    if user.update(user_params)
      render json: { avtar_url: url_for(user.avatar), notice: "Avatar updated successfully" }, status: :ok
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize user, policy_class: TeamMembers::AvatarPolicy

    user.avatar.destroy
    render json: { notice: "Avatar deleted successfully" }, status: :ok
  end

  private

    def user
      @_user ||= User.find(params[:team_id])
    end

    def user_params
      params.require(:user).permit(:avatar, :team_id)
    end
end
