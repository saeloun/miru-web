# frozen_string_literal: true

class Api::V1::Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json
  protect_from_forgery with: :null_session, only: :create

  def respond_with(user, _opts = {})
    if user.errors.present?
      render json: { error: user.errors }, status: 422
    else
      render json: {
        notice: I18n.t("devise.registrations.signed_up"),
        email: user.email,
        agent_payment_options: {
          stripe_link_cli: Subscriptions::StripeLinkCliPaymentOption.signup_payload
        }
      }, status: 200
    end
  end

  private

    def sign_up_params
      params.require(:user).permit(
        :first_name, :last_name, :email, :password, :password_confirmation, :locale
      )
    end
end
