# frozen_string_literal: true

class Api::V1::Users::PasswordsController < Devise::PasswordsController
  respond_to :json

  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    if successfully_sent?(resource)
      render json: { notice: I18n.t("password.create.success") }, status: 200
    else
      respond_with_error(resource)
    end
  end

  def update
    user = User.reset_password_by_token(password_params)
    if user.errors.empty?
      unless user.active_for_authentication?
        return render json: {
          error: I18n.t("devise.failure.inactive"),
          errors: [I18n.t("devise.failure.inactive")]
        }, status: :unprocessable_entity
      end

      sign_in(user) if Devise.sign_in_after_reset_password
      safe_user = user.as_json(only: %i[id email first_name last_name current_workspace_id])
      render json: { notice: I18n.t("password.update.success"), user: safe_user }, status: 200
    else
      respond_with_error(user)
    end
  end

  private

    def password_params
      params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
    end

    def respond_with_error(resource)
      errors = resource.errors.full_messages
      render json: { error: errors.first || "An error occurred", errors: errors }, status: :unprocessable_entity
    end
end
