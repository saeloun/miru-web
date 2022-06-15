# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(user)
    if user.has_role?(:owner) && user.companies.empty
      new_company_path
    elsif user.has_book_keeper_role?(current_company)
      payments_path
    else
      time_tracking_index_path
    end
  end
end
