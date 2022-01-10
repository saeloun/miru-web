# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :authenticate_user!, :validate_company!

  def redirect_path
    path = if current_user.has_any_role?(:owner, :admin)
      dashboard_index_path
    else
      time_trackings_path
    end
  end

  private
    def validate_company!
      return if current_user.nil?

      redirect_to new_company_path if current_user.company_id.nil? && current_user.owner?
    end
end
