# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include ErrorHandler

  before_action :authenticate_user!
  helper_method :current_company

  private
    def current_company
      @_current_company ||= current_user&.company
    end
end
