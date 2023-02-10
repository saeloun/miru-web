# frozen_string_literal: true

class InternalApi::V1::SessionsController < InternalApi::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def create
    user = User.find_for_database_authentication(email: user_params[:email])
    if invalid_password?(user)
      render json: { error: "Invalid email or password" }, status: :unprocessable_entity
    end

    if user.confirmed?
      sign_in(user)
      render json: { notice: "Signed in successfully", user: }, status: :ok
    end

    unless user.confirmed?
      render json: { notice: "Please confirm your email address to continue", user: }, status: :ok
    end
  end

  def destroy
    sign_out(@user)
    reset_session
  end

  private

    def user_params
      params.require(:user).permit(:email, :password)
    end

    def invalid_password?(user)
      user.blank? || !user.valid_password?(user_params[:password])
    end
end
