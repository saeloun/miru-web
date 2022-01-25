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

# file:///home/aniketkaushik/saeloun/miru-web/tmp/letter_opener/1643133656_054222_ebc77f0/rich.html
# file:///home/aniketkaushik/saeloun/miru-web/tmp/letter_opener/1643133137_656452_dc0fd22/rich.html
# file:///home/aniketkaushik/saeloun/miru-web/tmp/letter_opener/1643102766_4782655_8e19758/rich.html
