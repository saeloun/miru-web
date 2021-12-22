# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  protect_from_forgery with: :null_session
  respond_to :json

  def create
    @user = User.new

    @user.first_name = params[:first_name]
    @user.last_name = params[:last_name]
    @user.email = params[:email]
    @user.password = params[:password]

    if @user.save
      render json: @user
    else
      head(:unprocessable_entity)
    end
  end

  private
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
