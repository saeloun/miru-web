# frozen_string_literal: true

if ENV["TEST_ENV_NUMBER"]
  verbose_parallel_logs = ENV["PARALLEL_TEST_VERBOSE"] == "1"

  # Configure parallel test output
  RSpec.configure do |config|
    config.before(:suite) do
      next unless verbose_parallel_logs

      process_num = ENV["TEST_ENV_NUMBER"].to_i
      process_num = 1 if process_num == 0
      puts "\n[parallel] starting process ##{process_num}"
    end

    config.after(:suite) do
      next unless verbose_parallel_logs

      process_num = ENV["TEST_ENV_NUMBER"].to_i
      process_num = 1 if process_num == 0
      puts "\n[parallel] finished process ##{process_num}"
    end
  end
end
