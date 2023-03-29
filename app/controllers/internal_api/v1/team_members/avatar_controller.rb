# frozen_string_literal: true

class InternalApi::V1::TeamMembers::AvatarController < InternalApi::V1::ApplicationController
  def update
    authorize employment, policy_class: TeamMembers::AvatarPolicy

    user = employment.user
    user.update!(avatar_params)
    render json: { avatar_url: user.avatar_url, notice: "Avatar updated successfully" }, status: :ok
  end

  def destroy
    authorize employment, policy_class: TeamMembers::AvatarPolicy

    user = employment.user
    user.avatar.destroy!
    render json: { notice: "Avatar deleted successfully" }, status: :ok
  end

  private

    def employment
      @_employment ||= Employment.find_by!(user_id: params[:team_id], company_id: current_company.id)
    end

    def avatar_params
      params.require(:user).permit(:avatar)
    end
end
