# frozen_string_literal: true

class Api::V1::Users::RegistrationsController < Devise::RegistrationsController
  skip_before_action :verify_authenticity_token
  respond_to :json

  def create
    build_resource(sign_up_params)

    if resource.save
      if resource.active_for_authentication?
        sign_up(resource_name, resource)
        render json: {
          user: serialize_user(resource),
          token: resource.authentication_token,
          message: "User created successfully"
        }, status: 201
      else
        expire_data_after_sign_in!
        render json: {
          user: serialize_user(resource),
          message: "User created but needs confirmation"
        }, status: 201
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

    def sign_up_params
      params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
    end

    def serialize_user(user)
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name
      }
    end
end
