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

      current_company_context = CurrentCompanyContext.new(current_user, current_company)
      authorize current_company_context, :company_present?, policy_class: CurrentCompanyPolicy
    end
end
