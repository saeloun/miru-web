# frozen_string_literal: true

# Parallel Tests Configuration
# Enhanced progress reporting for parallel test execution

# Only configure in test environment and when parallel tests are running
if ENV["RAILS_ENV"] == "test" && ENV["TEST_ENV_NUMBER"]
  # Don't configure ParallelTests module directly as it may not be loaded yet
  # Just set up logging for parallel test processes

  # Custom progress reporter for better visibility
  Rails.application.config.after_initialize do
    if defined?(Rails.logger)
      # Add process indicator to Rails logger
      process_num = ENV["TEST_ENV_NUMBER"].to_i
      process_num = 1 if process_num == 0
      Rails.logger.info "[Process #{process_num}] Test process started"
    end
  end
end
