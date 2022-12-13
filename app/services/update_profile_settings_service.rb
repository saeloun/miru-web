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
    elsif validate_current_password && validate_password_length && validate_password_confirmation
      current_user.update_with_password(user_params)
      { res: { notice: "Password updated" }, status: :ok }
    else
      { res: { error: "Something went wrong" }, status: :unprocessable_entity }
    end
    rescue Exception => e
      { res: { error: e.message }, status: :unprocessable_entity }
  end

  def validate_current_password
    return true if current_user.valid_password?(user_params[:current_password])

    raise Exception.new("Current password is not correct")
  end

  def validate_password_confirmation
    return true if user_params[:password] == user_params[:password_confirmation]

    raise Exception.new("Password and password confirmation does not match")
  end

  def validate_password_length
    return true if user_params[:password].present? &&
    user_params[:password].length > 5 &&
    user_params[:password_confirmation].length > 5

    raise Exception.new("Password and password confirmation should be of minimum 6 characters")
  end
end
