# frozen_string_literal: true

class Api::V1::Users::PasswordsController < Devise::PasswordsController
  skip_before_action :verify_authenticity_token
  respond_to :json

  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: {
        message: "Reset password instructions sent to your email"
      }, status: 200
    else
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      render json: {
        message: "Password reset successfully"
      }, status: 200
    else
      set_minimum_password_length
      render json: {
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

    def resource_params
      params.require(:user).permit(:email, :password, :password_confirmation, :reset_password_token)
    end
end
