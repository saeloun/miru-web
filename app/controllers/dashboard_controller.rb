# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    if current_user.owner?
      redirect_to new_company_path
    else
      redirect_to new_user_session_path
    end
  end
end
