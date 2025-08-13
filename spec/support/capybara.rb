# frozen_string_literal: true

require "capybara/rails"
require "capybara/rspec"
require "capybara-playwright-driver"
require "playwright"

# Configure Capybara
Capybara.server = :puma, { Silent: true }
Capybara.default_max_wait_time = 10
Capybara.server_host = "localhost"
Capybara.save_path = Rails.root.join("tmp", "capybara")
Capybara.automatic_reload = false

# Use different ports for parallel tests
# Each parallel test worker gets its own port to avoid conflicts
if ENV["TEST_ENV_NUMBER"].present?
  # For parallel tests, use different port for each worker
  # TEST_ENV_NUMBER is empty for first process, then "2", "3", etc.
  test_number = ENV["TEST_ENV_NUMBER"].to_s.empty? ? 1 : ENV["TEST_ENV_NUMBER"].to_i
  Capybara.server_port = 3000 + test_number
else
  # For single process tests
  Capybara.server_port = 3001
end

# Also configure to use random available port if specified port is in use
Capybara.server = :puma, { Silent: true, Port: Capybara.server_port }

# Register Playwright driver with proper options
Capybara.register_driver :playwright do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: ENV["PLAYWRIGHT_BROWSER"]&.to_sym || :chromium,
    headless: ENV["HEADED"].blank?,
    timeout: 30_000,
    args: ["--disable-web-security", "--allow-insecure-localhost", "--disable-blink-features=AutomationControlled"])
end

# Register headless Playwright driver for CI
Capybara.register_driver :playwright_headless do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: ENV["PLAYWRIGHT_BROWSER"]&.to_sym || :chromium,
    headless: true,
    viewport: { width: 1400, height: 1000 },
    timeout: 30_000,
    args: ["--disable-web-security", "--allow-insecure-localhost", "--disable-blink-features=AutomationControlled"])
end

# Set default drivers
Capybara.default_driver = :rack_test
Capybara.javascript_driver = ENV["CI"].present? ? :playwright_headless : :playwright

# Override selenium drivers to use Playwright instead
# This is a workaround for tests that are hardcoded to use selenium drivers
Capybara.register_driver :selenium_chrome_headless do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: :chromium,
    headless: true)
end

Capybara.register_driver :selenium_chrome do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: :chromium,
    headless: false)
end

Capybara.register_driver :chrome_headless do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: :chromium,
    headless: true)
end

Capybara.register_driver :chrome do |app|
  Capybara::Playwright::Driver.new(app,
    browser_type: :chromium,
    headless: false)
end
