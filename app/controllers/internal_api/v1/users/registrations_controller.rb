# frozen_string_literal: true

class InternalApi::V1::Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def respond_with(user, _opts = {})
    if user.errors.present?
      render json: { error: user.errors }, status: :unprocessable_entity
    else
      render json: { notice: "Signed up successfully" }, status: :ok
    end
  end
end
