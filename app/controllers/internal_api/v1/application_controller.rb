# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  helper_method :current_company
  before_action :authenticate_user!

  def current_company
    @_current_company ||= current_user&.company
  end
end
