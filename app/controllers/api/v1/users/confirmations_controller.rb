# frozen_string_literal: true

class Api::V1::Users::ConfirmationsController < Devise::ConfirmationsController
  respond_to :json

  def create
    self.resource = resource_class.send_confirmation_instructions(resource_params)
    if successfully_sent?(resource)
      render json: { notice: I18n.t("confirmation.send_instructions", email: resource.email) }, status: 200
    else
      respond_with_error(resource)
    end
  end

  private

    def respond_with_error(resource)
      errors = resource.errors.full_messages
      render json: { error: errors.first || "An error occurred", errors: errors }, status: :unprocessable_entity
    end
end
