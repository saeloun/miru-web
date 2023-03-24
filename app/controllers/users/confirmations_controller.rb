# frozen_string_literal: true

class Users::ConfirmationsController < Devise::ConfirmationsController
  respond_to :json

  protected

    def after_confirmation_path_for(resource_name, resource)
      "/email_confirmed"
    end
end
