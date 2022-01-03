# frozen_string_literal: true

class DashboardController < ApplicationController
  before_action :validate_company!

  def index
    if current_user.owner?
      redirect_to new_company_path
    else
      redirect_to new_user_session_path
    end
  end

  private
    def validate_company!
      redirect_to new_company_path if current_user.company_id.nil? && current_user.owner?
    end
end
