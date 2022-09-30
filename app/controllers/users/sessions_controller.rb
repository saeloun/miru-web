# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(user)
    cookies[:leadsFilter] = {}
    cookies[:engagementsFilter] = {}
    if Pundit.policy!(user, :space_usage).index?
      root_path + "spaces"
    elsif user.has_role?(:owner) && user.companies.empty?
      new_company_path
    elsif user.has_role?(:book_keeper, current_company)
      # TODO: redirect to root and handle role based conditional redirection in react router
      root_path + "payments"
    else
      root_path
    end
  end
end
