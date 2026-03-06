# frozen_string_literal: true

require "capybara/rails"
require "capybara/rspec"
require "capybara-playwright-driver"
require "playwright"

# Configure Capybara
Capybara.server = :puma, { Silent: true }
Capybara.default_max_wait_time = 5
Capybara.server_host = "localhost"
Capybara.save_path = Rails.root.join("tmp", "capybara")
Capybara.automatic_reload = false

if ENV.key?("TEST_ENV_NUMBER")
  test_number = ENV.fetch("TEST_ENV_NUMBER", "").to_s
  test_number = test_number.empty? ? 1 : test_number.to_i
  Capybara.server_port = 35_000 + test_number
else
  Capybara.server_port = ENV.fetch("CAPYBARA_SERVER_PORT", (30_000 + (Process.pid % 10_000)).to_s).to_i
end

# Puma server is already configured above, don't override it
# The server_port is set separately and Puma will use it automatically

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
