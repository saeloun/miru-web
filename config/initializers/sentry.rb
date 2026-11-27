# frozen_string_literal: true

Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  # Set traces_sample_rate to 1.0 to capture 100%
  # of transactions for performance monitoring.
  # We recommend adjusting this value in production.
  config.traces_sample_rate = 1.0

  config.environment = Rails.env
  config.enabled_environments = %w[production staging]

  sanitize_event = lambda do |event, _hint|
    if event.is_a?(Sentry::TransactionEvent)
      event.spans.each do |span|
        span[:data]&.delete(:params)
        span[:data]&.delete("params")
      end
    end
    event.breadcrumbs&.each do |breadcrumb|
      data = breadcrumb.data
      next unless data.is_a?(Hash)

      data.delete(:params)
      data.delete("params")
      [:path, "path"].each do |key|
        data[key] = data[key].split("?", 2).first if data[key].is_a?(String)
      end
    end
    event
  end
  config.before_send = sanitize_event
  config.before_send_transaction = sanitize_event
end
