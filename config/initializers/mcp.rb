# frozen_string_literal: true

MCP.configure do |config|
  config.exception_reporter = ->(exception, server_context) {
    Rails.logger.error("[MCP] #{exception.class}: #{exception.message}")
    Sentry.capture_exception(exception, extra: { mcp: true }) if defined?(Sentry)
  }
end
