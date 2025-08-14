# frozen_string_literal: true

class InternalApi::V1::Users::PasswordsController < Devise::PasswordsController
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
      sign_in(user)
      render json: { notice: I18n.t("password.update.success"), user: }, status: 200
    else
      respond_with_error(user)
    end
  end

  private

    def password_params
      params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
    end

    def respond_with_error(resource)
      if resource.errors.any?
        resource.errors.full_messages.each do |message|
          render json: { error: message }, status: 422
        end
      end
    end
end
