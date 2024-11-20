# frozen_string_literal: true

module EmailRateLimiterAction
  extend ActiveSupport::Concern

  included do
    before_action :raise_email_limit_crossed_error
    after_action :update_email_rate_limiter
  end
end
