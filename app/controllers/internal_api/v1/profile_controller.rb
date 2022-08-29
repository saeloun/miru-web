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
    if params[:user][:current_password].blank?
      current_user.update_without_password(user_params.except(:current_password))
      render json: { notice: "User updated" }, status: :ok
    elsif validate_current_password && validate_password_length && validate_password_confirmation
      current_user.update_with_password(user_params)
      render json: { notice: "Password updated" }, status: :ok
    else
      render json: { error: "Something went wrong" }, status: :unprocessable_entity
    end
  rescue Exception => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

    def user_params
      params.require(:user).permit(
        :first_name, :last_name, :current_password, :password, :password_confirmation, :avatar, :color
      )
    end

    def validate_current_password
      return true if current_user.valid_password?(params[:user][:current_password])

      raise Exception.new("Current password is not correct")
    end

    def validate_password_confirmation
      return true if params[:user][:password] == params[:user][:password_confirmation]

      raise Exception.new("Password and password confirmation does not match")
    end

    def validate_password_length
      return true if params[:user][:password].present? &&
      params[:user][:password].length > 5 &&
      params[:user][:password_confirmation].length > 5

      raise Exception.new("Password and password confirmation should be of minimum 6 characters")
    end
end
