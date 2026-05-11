# frozen_string_literal: true

class UpdateProfileSettingsService
  attr_reader :current_user, :user_params

  def initialize(current_user, user_params)
    @current_user = current_user
    @user_params = user_params
  end

  def process
    if user_params[:current_password].blank?
      update_user_without_password
    else
      update_user_with_password
    end
  end

  def update_user_without_password
    if current_user.update_without_password(user_params.except(:current_password))
      { res: success_payload(I18n.t("companies.update.success")), status: :ok }
    else
      { res: { errors: current_user.errors.full_messages }, status: :unprocessable_content }
    end
  end

  def update_user_with_password
    if new_password_same_as_current_password?
      current_user.errors.add(:password, :same_as_current_password)
      return { res: { errors: current_user.errors.full_messages }, status: :unprocessable_content }
    end

    if current_user.update_with_password(user_params)
      { res: success_payload(I18n.t("password.update.success")), status: :ok }
    else
      { res: { errors: current_user.errors.full_messages }, status: :unprocessable_content }
    end
  end

  private

    def new_password_same_as_current_password?
      user_params[:password].present? && current_user.valid_password?(user_params[:password])
    end

    def success_payload(notice)
      {
        notice:,
        user: {
          avatar_url: current_user.avatar_url,
          password_changed_at: current_user.password_changed_at
        }
      }
    end
end
