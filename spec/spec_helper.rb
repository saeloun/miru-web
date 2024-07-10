# frozen_string_literal: true

require "simplecov"
require "pundit/rspec"
require "webmock/rspec"
require "rspec/retry"
# require "buildkite/test_collector"

# Buildkite::TestCollector.configure(hook: :rspec)

if ENV.fetch("COVERAGE", false)
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
    example.run_with_retry retry: 3
  end

  # config.retry_callback = proc do |ex|
  #   # run some additional clean up task - can be filtered by example metadata
  #   if ex.metadata[:js]
  #     Capybara.reset!
  #   end
  # end
end
