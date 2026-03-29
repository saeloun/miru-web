# frozen_string_literal: true

class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  # Retry on database connection failures (e.g., server closed connection unexpectedly)
  retry_on ActiveRecord::ConnectionFailed, wait: :polynomially_longer, attempts: 5
  retry_on PG::ConnectionBad, wait: :polynomially_longer, attempts: 5

  # Most jobs are safe to ignore if the underlying records are no longer available
  # discard_on ActiveJob::DeserializationError
end
