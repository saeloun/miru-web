# frozen_string_literal: true

class MissionControlController < ApplicationController
  before_action :authenticate!, if: :restricted_env?
  skip_after_action :verify_authorized

  private

    def authenticate!
      authenticate_or_request_with_http_basic do |username, password|
        username == ENV.fetch("SOLID_QUEUE_USERNAME") && password == ENV.fetch("SOLID_QUEUE_PASSWORD")
      end
    end

    def restricted_env?
      Rails.env.production?
    end
end
