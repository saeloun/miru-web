# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private
    def record_not_found
      render json: { success: false, message: "Record not found" }
    end
end
