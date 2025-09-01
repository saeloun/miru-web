# frozen_string_literal: true

require "simplecov"
require "pundit/rspec"
require "webmock/rspec"
require "rspec/retry"

# Allow YAML to load BigDecimal for test factories
require "yaml"
require "bigdecimal"
# Configure Psych to allow BigDecimal
if defined?(Psych) && Psych.respond_to?(:unsafe_load)
  module Psych
    class << self
      alias_method :original_safe_load, :safe_load
      def safe_load(yaml, permitted_classes: [], permitted_symbols: [], **kwargs)
        permitted_classes = (permitted_classes + [BigDecimal, Date, Time, DateTime]).uniq
        original_safe_load(yaml, permitted_classes: permitted_classes, permitted_symbols: permitted_symbols, **kwargs)
      end
    end
  end
end
# require "buildkite/test_collector"

# Buildkite::TestCollector.configure(hook: :rspec)

# Enhanced RSpec reporting (only load if gems are available)
begin
  require "super_diff/rspec" if ENV["SUPER_DIFF"] != "false"
rescue LoadError
  # Super diff not available
end

if ENV.fetch("COVERAGE", false)
  require "simplecov"

  # Configure SimpleCov for parallel tests
  if ENV["TEST_ENV_NUMBER"]
    SimpleCov.command_name "RSpec Process #{ENV['TEST_ENV_NUMBER']}"
    SimpleCov.merge_timeout 3600
  end

  SimpleCov.start "rails" do
    add_filter "/bin/"
    add_filter "/db/"
    add_filter "/spec/"
    add_filter "app/views"
    add_filter "app/channels"
    add_filter "app/jobs"
    add_filter "app/mailers"
  end
end

#
# See http://rubydoc.info/gems/rspec-core/RSpec/Core/Configuration
RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
end

RSpec.configure do |config|
  config.verbose_retry = true
  config.display_try_failure_messages = true

  config.around do |example|
    # Don't retry system tests as they use Playwright now
    if example.metadata[:type] == :system
      example.run
    else
      example.run_with_retry retry: 3
    end
  end

  # config.retry_callback = proc do |ex|
  #   # run some additional clean up task - can be filtered by example metadata
  #   if ex.metadata[:js]
  #     Capybara.reset!
  #   end
  # end
end
