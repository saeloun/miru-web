# frozen_string_literal: true

class Api::V1::ProfileController < Api::V1::ApplicationController
  def update
    authorize :update, policy_class: ProfilePolicy
    service = UpdateProfileSettingsService.new(current_user, user_params).process
    render json: service[:res], status: service[:status]
  end

  private

    def user_params
      params.require(:user).permit(
        :first_name, :last_name, :current_password, :password, :password_confirmation,
        :avatar, :date_of_birth, :phone, :personal_email_id,
        social_accounts: {}
      )
    end
end
