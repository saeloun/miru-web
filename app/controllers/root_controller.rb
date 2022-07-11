# frozen_string_literal: true

class RootController < ApplicationController
  skip_after_action :verify_authorized

  def index
    if current_user.can_access_lead?
      path = leads_path
    elsif current_user.can_access_space_usage?
      path = space_occupying_index_path
    elsif current_user.has_role?(:owner) && current_user.companies.empty?
      path = new_company_path
    elsif current_user.has_role?(:book_keeper, current_company)
      path = payments_path
    else
      path = dashboard_index_path
    end
    redirect_to path
  end
end
