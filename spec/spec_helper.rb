# frozen_string_literal: true

require "simplecov"
require "pundit/rspec"
require "sidekiq/testing"
require "webmock/rspec"
require "rspec/retry"
require "capybara/rspec"
require "capybara/rails"

Capybara.server = :puma

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

# http://rubydoc.info/gems/rspec-core/RSpec/Core/Configuration
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
  # show retry status in spec process
  config.verbose_retry = true
  # show exception that triggers a retry if verbose_retry is set to true
  config.display_try_failure_messages = true

  # run retry only on features
  config.around do |ex|
    ex.run_with_retry retry: 3
  end

  config.retry_callback = proc do |ex|
    if ex.metadata[:js]
      Capybara.reset!
    end
  end
end
