# frozen_string_literal: true

if ENV["RAILS_ENV"] == "test" && ENV["TEST_ENV_NUMBER"] && ENV["PARALLEL_TEST_VERBOSE"] == "1"
  Rails.application.config.after_initialize do
    next unless defined?(Rails.logger)

    process_num = ENV["TEST_ENV_NUMBER"].to_i
    process_num = 1 if process_num == 0
    Rails.logger.info "[parallel] process #{process_num} started"
  end
end
