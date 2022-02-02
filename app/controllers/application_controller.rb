# frozen_string_literal: true

class ApplicationController < ActionController::Base
  helper_method :current_company
  before_action :authenticate_user!, :validate_company!


  def current_company
    @_current_company ||= current_user&.company
  end

  private
    def validate_company!
      return if current_user.nil?

      redirect_to new_company_path unless current_company
    end
end
