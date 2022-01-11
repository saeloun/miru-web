# frozen_string_literal: true

class ApplicationController < ActionController::Base
  before_action :authenticate_user!, :validate_company!

  private
    def validate_company!
      return if current_user.nil?

      redirect_to new_company_path if current_user.company_id.nil? && current_user.has_role?(:owner)
    end
end
