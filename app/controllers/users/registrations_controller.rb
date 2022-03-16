# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  def purge_avatar
    user = User.find(params[:id])
    user.avatar.destroy
    redirect_to profile_path
  end

  protected
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
