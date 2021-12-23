# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  protect_from_forgery with: :null_session
  respond_to :json

  def create
    @user = User.new(user_params)

    if @user.save
      render :create
    else
      render :errors
    end
  end

  private
    def user_params
      params.permit(:first_name, :last_name, :email, :password)
    end

    def respond_with(resource, _opts = {})
      register_success && return if resource.persisted?

      register_failed
    end

    def register_success
      render json: { message: "Signed up sucessfully." }
    end

    def register_failed
      render json: { message: "Something went wrong." }
    end
end
