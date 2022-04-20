# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(resource)
    return new_company_path if resource.companies.empty? && resource.has_role?(:owner)

    if resource.has_owner_or_admin_role?(current_company)
      dashboard_index_path
    elsif resource.has_book_keeper_role?(current_company)
      payments_path
    else
      time_tracking_index_path
    end
  end
end
