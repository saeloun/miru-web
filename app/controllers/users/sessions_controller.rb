# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def create
    authorize current_user, policy_class: Users::DevicePolicy

    super
  end

  def after_sign_in_path_for(user)
    if user.has_role?(:owner) && user.companies.empty?
      new_company_path
    elsif user.has_role?(:book_keeper, current_company)
      # TODO: redirect to root and handle role based conditional redirection in react router
      root_path + "payments"
    else
      root_path + "time-tracking"
    end
  end
end
