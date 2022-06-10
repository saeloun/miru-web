# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(resource)
    return new_company_path if resource.companies.empty? && resource.has_role?(:owner)

    leads_path

    # As per discussion we want to redirect all the users to time-tracking page as dashboard is blank.
    # if resource.has_owner_or_admin_role?(current_company)
    #   dashboard_index_path
    # else
    #   time_tracking_index_path
    # end
  end
end
