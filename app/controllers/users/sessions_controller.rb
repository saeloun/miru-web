# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(user)
    if user.has_role?(:owner) && user.companies.empty?
      new_company_path
    elsif user.has_role?(:book_keeper, current_company)
      root_path + "payments"
    else
      root_path + "time-tracking"
    end
  end
end
