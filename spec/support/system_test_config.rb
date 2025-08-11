# frozen_string_literal: true

# Rails 8 System Test Configuration
RSpec.configure do |config|
  config.before(:each, type: :system) do
    # Set the driver for system tests - use Selenium drivers
    driven_by = ENV["CI"].present? ? :chrome_headless : :chrome
    Capybara.current_driver = driven_by
    Capybara.javascript_driver = driven_by

    # Ensure server is running
    Capybara.server = :puma, { Silent: true }
  end

  config.after(:each, type: :system) do |example|
    # Take screenshot on failure (only if driver supports it)
    if example.exception && page && page.driver.respond_to?(:save_screenshot)
      timestamp = Time.now.strftime("%Y%m%d%H%M%S")
      screenshot_name = "failure_#{timestamp}.png"
      begin
        page.save_screenshot(Rails.root.join("tmp", "capybara", screenshot_name))
        puts "Screenshot saved: tmp/capybara/#{screenshot_name}"
      rescue Capybara::NotSupportedByDriverError
        # Ignore if driver doesn't support screenshots
      end
    end

    # Clean up
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

  # Include system test helpers
  config.include Capybara::DSL, type: :system
  config.include Capybara::RSpecMatchers, type: :system
end

# Monkey patch for Rails 8 compatibility - fix needs_server? error
module Capybara
  module DSL
    def needs_server?
      true
    end
  end
end

# Also add to global scope for system tests
def needs_server?
  true
end
