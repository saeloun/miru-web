# frozen_string_literal: true

class InternalApi::V1::ProfileController < InternalApi::V1::ApplicationController
  def show
    authorize :index, policy_class: ProfilePolicy
    if current_user.avatar.attached?
      avatar_url = url_for(current_user.avatar)
    end
    render json: { user: current_user.as_json.merge("avatar_url" => avatar_url) }, status: :ok
  end

  def remove_avatar
    authorize :remove_avatar, policy_class: ProfilePolicy
    current_user.avatar.destroy
    render json: { notice: "Avatar deleted successfully" }, status: :ok
  end

  def update
    authorize :update, policy_class: ProfilePolicy
    service = UpdateProfileSettingsService.new(current_user, user_params).process
    render json: service[:res], status: service[:status]
  end

  private

    def user_params
      params.require(:user).permit(
        :first_name, :last_name, :current_password, :password, :password_confirmation, :avatar
      )
    end
end
