# frozen_string_literal: true

# Configure Solid Queue to handle database connection failures gracefully
# This addresses the issue where PostgreSQL connections are unexpectedly closed
# (e.g., during server restarts, maintenance, or container orchestration events)

Rails.application.config.after_initialize do
  ActiveRecord::Base.connection_pool.flush! if Rails.env.production?

  # Configure Solid Queue's on_thread_error to handle connection failures
  if defined?(SolidQueue)
    SolidQueue.on_thread_error = ->(exception) {
      # Log the error
      Rails.logger.error("[SolidQueue] Thread error: #{exception.class} - #{exception.message}")

      # Report to Sentry if available
      Sentry.capture_exception(exception) if defined?(Sentry)

      # Check exception cause chain for connection failures
      error = exception
      connection_failure = false
      while error
        if error.is_a?(ActiveRecord::ConnectionFailed) || error.is_a?(PG::ConnectionBad)
          connection_failure = true
          break
        end
        error = error.cause
      end

      # Attempt to reconnect on connection failures
      if connection_failure
        Rails.logger.warn("[SolidQueue] Attempting to reconnect to database...")
        begin
          ActiveRecord::Base.connection_pool.with_connection do |connection|
            connection.reconnect!
          end
        rescue StandardError => e
          Rails.logger.error("[SolidQueue] Reconnection failed: #{e.message}")
        end
      end
    }
  end
end
