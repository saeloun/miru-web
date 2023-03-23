# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(user)
    if user.has_role?(:owner) && user.companies.empty?
      root_path
    elsif user.has_role?(:book_keeper, current_company)
      # TODO: redirect to root and handle role based conditional redirection in react router
      root_path + "payments"
    elsif user.has_role?(:owner, current_company)
      root_path + "invoices"
    else
      root_path + "time-tracking"
    end
  end
end
