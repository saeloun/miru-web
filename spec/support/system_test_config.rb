# frozen_string_literal: true

# Rails 8 System Test Configuration with Playwright
RSpec.configure do |config|
  # Use append_before to ensure this runs after other configurations
  config.append_before(:each, type: :system) do |example|
    # Set the driver for system tests - use Playwright drivers
    # For JavaScript tests, use Playwright
    if example.metadata[:js]
      Capybara.current_driver = ENV["CI"].present? ? :playwright_headless : :playwright
    else
      # For non-JS tests, use rack_test
      Capybara.current_driver = :rack_test
    end
    
    # Also set javascript_driver
    Capybara.javascript_driver = ENV["CI"].present? ? :playwright_headless : :playwright

    # Ensure server is running
    Capybara.server = :puma, { Silent: true }
  end

  config.after(:each, type: :system) do |example|
    # Take screenshot on failure (Playwright supports screenshots)
    if example.exception && page
      timestamp = Time.now.strftime("%Y%m%d%H%M%S")
      screenshot_name = "failure_#{timestamp}.png"
      begin
        page.save_screenshot(Rails.root.join("tmp", "capybara", screenshot_name))
        puts "Screenshot saved: tmp/capybara/#{screenshot_name}"
      rescue StandardError => e
        # Ignore if driver doesn't support screenshots
        puts "Could not save screenshot: #{e.message}"
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