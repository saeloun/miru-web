# frozen_string_literal: true

class InternalApi::V1::PasswordsController < Devise::PasswordsController
  respond_to :json

  private

    def respond_with(user, _opts = {})
      if resource.errors.any?
        user.errors.full_messages.each do |message|
          return render json: { error: message }, status: :unprocessable_entity
        end
      end

      if resource.reset_password_token.nil?
        render json: {
          notice: "Password reset failed",
          redirect_route: new_user_session_path
        }, status: :ok
      else
        render json: {
          notice: "Password reset successful",
          redirect_route: new_user_session_path
        }, status: :ok
      end
    end
end
