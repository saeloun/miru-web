# frozen_string_literal: true

class InternalApi::V1::Users::EmailConfirmationsController < InternalApi::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :verify_confirmed_user

  def resend
    user.send_confirmation_instructions
    render json: { notice: I18n.t("confirmation.send_instructions", email: user.email) },
      status: :ok
  end

  private

    def verify_confirmed_user
      if user.confirmed?
        redirect_to root_path
      end
    end

    def user
      @_user ||= User.kept.find_by_email!(params[:email])
    end
end
