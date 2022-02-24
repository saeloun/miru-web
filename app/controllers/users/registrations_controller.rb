# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_permitted_parameters

  def purge_avatar
    user = User.find(params[:id])
    user.avatar.destroy
    redirect_to profile_path
  end

  protected
    def configure_permitted_parameters
      devise_parameter_sanitizer.permit(:sign_up, keys: [:first_name, :last_name, :email, :password, :password_confirmation, :avatar])
      devise_parameter_sanitizer.permit(:account_update, keys: [:first_name, :last_name, :email, :password, :password_confirmation, :avatar])
    end

    def update_resource(resource, params)
      if params[:current_password].blank?
        resource.update_without_password(params.except(:current_password))
      else
        resource.update_with_password(params)
      end
    end

    def after_update_path_for(resource)
      profile_path
    end

    def after_inactive_sign_up_path_for(resource)
      set_flash_message! :notice, :signed_up_but_unconfirmed
      new_user_session_path
    end
end
