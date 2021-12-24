# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  protect_from_forgery with: :null_session
  respond_to :json

  def create
    @user = User.find_by(email: params[:email])

    if @user
      render :create, formats: [:json], status: :created
    else
      render :errors, formats: [:json], status: :unprocessable_entity
    end
  end

  private
    def respond_with(resource, _opts = {})
      render :create, status: :ok
    end

    def respond_to_on_destroy
      log_out_success && return if current_user

      log_out_failure
    end

    def log_out_success
      render json: { message: "You are logged out." }, status: :ok
    end

    def log_out_failure
      render json: { message: "Logout Failed" }, status: :unauthorized
    end
end
