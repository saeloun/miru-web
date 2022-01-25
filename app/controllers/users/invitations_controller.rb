# frozen_string_literal: true

class Users::InvitationsController < Devise::InvitationsController
  before_action :configure_permitted_parameters
  after_action :assign_role, only: [:create]

  protected
    # Permit the new params here.
    def configure_permitted_parameters
      devise_parameter_sanitizer.permit(:invite, keys: [:first_name, :last_name, :company_id])
    end

    def assign_role
      if resource.errors.empty?
        resource.add_role(params[:user][:roles].downcase.to_sym)
      end
    end
end
