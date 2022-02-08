# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  before_action :authenticate_user!
  helper_method :current_company
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private
    def current_company
      @_current_company ||= current_user&.company
    end

    def record_not_found
      render json: { success: false, message: "Record not found" }
    end
end
