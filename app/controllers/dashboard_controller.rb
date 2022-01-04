# frozen_string_literal: true

class DashboardController < ApplicationController
  before_action :validate_company!

  def index
  end

  private
    def validate_company!
      redirect_to new_company_path if current_user.company_id.nil? && current_user.owner?
    end
end
