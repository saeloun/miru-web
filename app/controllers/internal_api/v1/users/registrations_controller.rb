# frozen_string_literal: true

class InternalApi::V1::Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  def create
    raise StandardError
  rescue StandardError => error
    Rails.logger.error error.message
    Rails.logger.error params
    render json: { error: "Can't process this request" }, status: :unprocessable_entity
  end

  def respond_with(user, _opts = {})
    if user.errors.present?
      render json: { error: user.errors }, status: :unprocessable_entity
    else
      render json: { notice: I18n.t("devise.registrations.signed_up"), email: user.email }, status: :ok
    end
  end
end
