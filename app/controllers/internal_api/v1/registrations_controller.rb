# frozen_string_literal: true

class InternalApi::V1::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

    def respond_with(user, _opts = {})
      if user.present?
        if user.confirmed?
          render json: {
            notice: "Already email exists. Please signin",
            redirect_route: new_user_session_path
          }, status: :ok
        else
          render json: {
            notice: "Please verify your email to proceed further",
            redirect_route: email_confirmation_path({ email: user.email })
          }, status: :ok
        end
      end
    end
end
