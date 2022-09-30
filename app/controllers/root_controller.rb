# frozen_string_literal: true

class RootController < ApplicationController
  skip_after_action :verify_authorized

  def index
    if Pundit.policy!(current_user, :space_usage).index?
      path = "spaces"
    # elsif current_user.has_role?(:owner) && current_user.companies.empty?
    #  path = new_company_path
    elsif current_user.has_role?(:book_keeper, current_company)
      path = "payments"
    end
    redirect_to root_path + path # TODO: redirect to root and handle conditional redirection in react router
  end
end
