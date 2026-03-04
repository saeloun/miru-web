# frozen_string_literal: true

class HealthController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def index
    status = check_database ? :ok : :service_unavailable

    render json: {
      status: status == :ok ? "healthy" : "unhealthy",
      timestamp: Time.current
    }, status: status
  end

  private

    def check_database
      ActiveRecord::Base.connection.execute("SELECT 1")
      true
    rescue StandardError => e
      Rails.logger.error "Health check database failed: #{e.message}"
      false
    end
end
