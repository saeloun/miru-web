# frozen_string_literal: true

class MissionControlController < ApplicationController
  before_action :authenticate!
  skip_after_action :verify_authorized

  private

    def authenticate!
      authenticate_or_request_with_http_basic do |username, password|
        expected_username = ENV["SOLID_QUEUE_USERNAME"].to_s
        expected_password = ENV["SOLID_QUEUE_PASSWORD"].to_s
        next false if expected_username.blank? || expected_password.blank?

        username_matches = ActiveSupport::SecurityUtils.secure_compare(username.to_s, expected_username)
        password_matches = ActiveSupport::SecurityUtils.secure_compare(password.to_s, expected_password)
        username_matches && password_matches
      end
    end
end
