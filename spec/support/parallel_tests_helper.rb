# frozen_string_literal: true

# Parallel Tests Configuration for RSpec
# Provides better progress reporting and test distribution

if ENV["TEST_ENV_NUMBER"]
  # Configure parallel test output
  RSpec.configure do |config|
    # Add process number to test output for clarity
    config.before(:suite) do
      process_num = ENV["TEST_ENV_NUMBER"].to_i
      process_num = 1 if process_num == 0
      puts "\n🚀 Starting test process ##{process_num}"
    end

    # Show progress for each test file
    config.before(:each) do |example|
      if example.metadata[:type] == :system
        puts "  [Process #{ENV['TEST_ENV_NUMBER']}] Running: #{example.metadata[:description]}"
      end
    end

    # Summary at the end of each process
    config.after(:suite) do
      process_num = ENV["TEST_ENV_NUMBER"].to_i
      process_num = 1 if process_num == 0
      puts "\n✅ Process ##{process_num} completed"
    end
  end

  # Configure database for parallel tests
  class ActiveRecord::Base
    def self.establish_connection(config = nil)
      config ||= Rails.application.config.database_configuration[Rails.env]
      config = config.merge("database" => "#{config['database']}_#{ENV['TEST_ENV_NUMBER']}")
      super(config)
    end
  end
end

# Custom formatter for better parallel test visibility
module ParallelTests
  module RSpec
    class ProgressFormatter < ::RSpec::Core::Formatters::ProgressFormatter
      def initialize(output)
        super
        @process = ENV["TEST_ENV_NUMBER"] || "1"
      end

      def example_passed(notification)
        output.print "\e[32m[P#{@process}].\e[0m"
      end

      def example_failed(notification)
        output.print "\e[31m[P#{@process}]F\e[0m"
      end

      def example_pending(notification)
        output.print "\e[33m[P#{@process}]*\e[0m"
      end

      def dump_summary(notification)
        output.puts "\n\n[Process #{@process}] Finished:"
        output.puts "  Examples: #{notification.example_count}"
        output.puts "  Failures: #{notification.failure_count}"
        output.puts "  Pending: #{notification.pending_count}"
        output.puts "  Duration: #{notification.duration.round(2)}s"
      end
    end
  end
end
