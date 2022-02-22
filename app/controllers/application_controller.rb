# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include ErrorHandler
  include CurrentCompany

  helper_method :current_company
  before_action :authenticate_user!, :validate_company!
  after_action :verify_authorized, unless: :devise_controller?

  private
    def validate_company!
      return if current_user.nil?

      authorize current_company, :company_present?, policy_class: CompanyPolicy
    end
end
