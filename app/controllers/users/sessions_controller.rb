# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(resource)
    return new_company_path if resource.companies.empty? && resource.has_role?(:owner)

    resource.has_book_keeper_role?(current_company) ? payments_path : time_tracking_index_path
  end
end
