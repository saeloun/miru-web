# frozen_string_literal: true

require "simplecov"
require "pundit/rspec"
require "webmock/rspec"

# Allow YAML to load and dump BigDecimal for test factories (Psych 5+ / Ruby 4.0+)
require "yaml"
require "bigdecimal"

# Psych 5+ uses RestrictedYAMLTree for dump which rejects unknown classes.
# Patch `accept` to always permit BigDecimal alongside the configured permitted_classes.
if defined?(Psych::Visitors::RestrictedYAMLTree)
  module PsychBigDecimalDumpFix
    def accept(target)
      if target.is_a?(BigDecimal)
        @permitted_classes[BigDecimal] = true
      end
      super
    end
  end
  Psych::Visitors::RestrictedYAMLTree.prepend(PsychBigDecimalDumpFix)
end

# Psych 5+ safe_load also rejects BigDecimal by default.
# Ensure it's always in the permitted_classes list.
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

  # Exclude system_skip folder - these are specs for features not yet implemented
  config.exclude_pattern = "**/system_skip/**/*_spec.rb"

  # Configure JUnit output for CI with parallel tests
  if ENV["CI"]
    require "rspec_junit_formatter"
    # Use TEST_ENV_NUMBER for parallel test processes (empty string for first process)
    process_num = ENV["TEST_ENV_NUMBER"].to_s.empty? ? "0" : ENV["TEST_ENV_NUMBER"]
    config.add_formatter "RspecJunitFormatter", "tmp/rspec#{process_num}.xml"
  end
end
