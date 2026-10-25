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

  config.before_send_transaction = lambda do |event, _hint|
    event.spans.each do |span|
      next unless span[:description].to_s.start_with?("Api::V1::Hiring::", "Hiring::InboundEmailsController")

      data = span[:data]
      next unless data && data[:params].is_a?(Hash)

      data[:params] = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters).filter(data[:params])
    end
    event
  end
end
