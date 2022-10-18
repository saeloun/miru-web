# frozen_string_literal: true

sentry_dsn = ENV.fetch("SENTRY_DSN", nil)
return unless sentry_dsn

Sentry.init do |config|
  config.dsn = sentry_dsn
  config.breadcrumbs_logger = %i[active_support_logger http_logger]

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = 1.0

  # Excluding Exceptions
  config.excluded_exceptions += ["ActionController::RoutingError"]

  config.enabled_environments = %w[production]
  config.debug = true
end
