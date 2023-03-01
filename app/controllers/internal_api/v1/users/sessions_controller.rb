# frozen_string_literal: true

class InternalApi::V1::Users::SessionsController < Devise::SessionsController
  respond_to :json

  def create
    user = User.find_for_database_authentication(email: user_params[:email])
    if invalid_password?(user)
      return render json: { error: I18n.t("sessions.failure.invalid") }, status: :unprocessable_entity
    end

    sign_in(user)
    render json: { notice: I18n.t("devise.sessions.signed_in"), user: }, status: :ok
  end

  def destroy
    sign_out(@user)
    reset_session
    render json: { notice: I18n.t("devise.sessions.signed_out") }, status: :ok
  end

  private

    def user_params
      params.require(:user).permit(:email, :password)
    end

    def invalid_password?(user)
      user.blank? || !user.valid_password?(user_params[:password])
    end
end
