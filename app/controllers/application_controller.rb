# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include ErrorHandler
  helper_method :current_company
  before_action :authenticate_user!, :validate_company!
  after_action :verify_authorized, unless: :devise_controller?

  def current_company
    @_current_company ||= current_user&.company
  end

  private
    def validate_company!
      return if current_user.nil?

      redirect_to new_company_path unless current_company
    end
end
