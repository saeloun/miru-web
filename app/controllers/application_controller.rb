# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include ErrorHandler
  helper_method :current_company
  before_action :authenticate_user!, :validate_company!
  after_action :verify_authorized, unless: :devise_controller?

  def current_company
    @_current_company ||= current_user&.current_workspace || current_user.companies.first

    if current_user.current_workspace_id.nil? && @_current_company.present?
      current_user.update(current_workspace_id: @_current_company.id)
    end

    @_current_company
  end

  private
    def validate_company!
      return if current_user.nil?

      current_company_context = CurrentCompanyContext.new(current_user, current_company)
      authorize current_company_context, :company_present?, policy_class: CurrentCompanyPolicy
    end
end
