# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  def after_sign_in_path_for(user)
    cookies[:leadsFilter] = {}
    cookies[:engagementsFilter] = {}
    if user.can_access_lead?
      leads_path
    elsif user.can_access_space_usage?
      space_occupying_index_path
    elsif user.has_role?(:owner) && user.companies.empty?
      new_company_path
    elsif user.has_role?(:book_keeper, current_company)
      payments_path
    else
      dashboard_index_path
    end
  end
end
