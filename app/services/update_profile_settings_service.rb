# frozen_string_literal: true

class UpdateProfileSettingsService
  attr_reader :current_user, :user_params

  def initialize(current_user, user_params)
    @current_user = current_user
    @user_params = user_params
  end

  def process
    if user_params[:current_password].blank?
      current_user.update_without_password(user_params.except(:current_password))
      { res: { notice: "User updated" }, status: :ok }
    else
      update_profile_along_with_password
    end
    rescue Exception => e
      { res: { error: e.message }, status: :unprocessable_entity }
  end

  def update_profile_along_with_password
    if current_user.update_with_password(user_params)
      { res: { notice: "Password updated" }, status: :ok }
    else
      raise Exception.new(current_user.errors.full_messages)
    end
  end
end
