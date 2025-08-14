# frozen_string_literal: true

class HealthController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def index
    checks = {
      database: check_database,
      redis: check_redis,
      storage: check_storage
    }

    status = checks.values.all? ? :ok : :service_unavailable

    render json: {
      status: status == :ok ? "healthy" : "unhealthy",
      timestamp: Time.current,
      checks: checks,
      version: ENV.fetch("RAILS_APP_VERSION", "unknown"),
      branch: ENV.fetch("REVIEW_APP_BRANCH", "main")
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

    def check_redis
      if defined?(Redis) && Rails.cache.respond_to?(:redis)
        Rails.cache.redis.ping == "PONG"
      else
        true # Redis is optional
      end
    rescue StandardError => e
      Rails.logger.error "Health check redis failed: #{e.message}"
      false
    end

    def check_storage
      ActiveStorage::Blob.service.exist?("health-check")
      true
    rescue StandardError => e
      # Storage might not be configured, which is okay
      Rails.logger.info "Health check storage skipped: #{e.message}"
      true
    end
end
