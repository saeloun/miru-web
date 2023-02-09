# frozen_string_literal: true

Sentry.init do |config|
  config.dsn = "https://c4c00a5cc17647ac83f27f48af7d5e4f@o744686.ingest.sentry.io/4504649746087936"
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = 1.0

  config.environment = Rails.env
end
