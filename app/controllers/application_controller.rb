# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  helper_method :current_company
  before_action :authenticate_user!, :validate_company!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  def current_company
    @_current_company ||= current_user&.company
  end

  private
    def validate_company!
      return if current_user.nil?

      redirect_to new_company_path unless current_company
    end

    def user_not_authorized
      flash[:alert] = "You are not authorized to perform this action."
      redirect_to(request.referrer || root_path)
    end
end
