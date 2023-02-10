# frozen_string_literal: true

class Users::ConfirmationsController < Devise::ConfirmationsController
  protected

    def after_confirmation_path_for(resource_name, resource)
      root_path
    end
end
