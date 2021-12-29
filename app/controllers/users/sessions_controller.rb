# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  protect_from_forgery with: :null_session
  respond_to :json
  before_action :authenticate_user

  private
    def authenticate_user
      user = User.find_by(email: params[:user][:email])
      @resource = user && user&.valid_password?(params[:user][:password])
    end

    def respond_with(resource, _opts = {})
      if @resource
        render :create, status: :ok
      else
        render :errors, status: :unauthorized
      end
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
