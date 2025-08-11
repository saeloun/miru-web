# frozen_string_literal: true

class InternalApi::V1::Users::SessionsController < Devise::SessionsController
  skip_before_action :verify_authenticity_token, only: :create

  respond_to :json

  def create
    user = User.find_for_database_authentication(email: user_params[:email])

    if invalid_password?(user)
      render_invalid_password_error
    elsif !user.confirmed?
      render_unconfirmed_user_error(user)
    else
      handle_successful_sign_in(user)
    end
  end

  def destroy
    sign_out(current_user)
    reset_session
    render json: { notice: I18n.t("devise.sessions.signed_out"), reset_session: true }, status: 200
  end

  private

    def user_params
      params.require(:user).permit(:email, :password)
    end

    def invalid_password?(user)
      user.blank? || !user.valid_password?(user_params[:password])
    end

    def render_invalid_password_error
      render json: { error: I18n.t("sessions.failure.invalid") }, status: :unprocessable_entity
    end

    def render_unconfirmed_user_error(user)
      render json: {
        error: I18n.t("devise.failure.unconfirmed"),
        unconfirmed: !user.confirmed?
      }, status: :unprocessable_entity
    end

    def handle_successful_sign_in(user)
      sign_in(user)

      app = params[:app] || ""

      if app == "miru-desktop"
        render_sign_in_response_for_desktop(user)
      else
        render_sign_in_response(user)
      end
    end

    def render_sign_in_response(user)
      render json: { notice: I18n.t("devise.sessions.signed_in"), user: }, status: 200
    end

    def render_sign_in_response_for_desktop(user)
      initial_props = {
        user:,
        avatar_url: current_user && current_user.avatar_url,
        company_role: current_user && current_user.roles.find_by(resource: current_company)&.name,
        confirmed_user: current_user && current_user.confirmed?,
        company: current_company,
        google_oauth_success: @google_oauth_success.present?
      }

      render json: { notice: I18n.t("devise.sessions.signed_in"), **initial_props }, status: 200
    end
end
