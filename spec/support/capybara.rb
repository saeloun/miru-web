# frozen_string_literal: true

require "capybara/rails"
require "capybara/rspec"
require "selenium-webdriver"

# Configure Capybara
Capybara.server = :puma, { Silent: true }
Capybara.default_max_wait_time = 5
Capybara.server_host = "localhost"
Capybara.save_path = Rails.root.join("tmp", "capybara")

# Use different ports for parallel tests
if ENV["TEST_ENV_NUMBER"]
  Capybara.server_port = 3001 + ENV["TEST_ENV_NUMBER"].to_i
else
  Capybara.server_port = 3001
end

# Register Chrome driver with proper options
Capybara.register_driver :chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument("--disable-search-engine-choice-screen")
  options.add_argument("--window-size=1400,1000")
  options.add_argument("--disable-blink-features=AutomationControlled")
  options.add_argument("--disable-dev-shm-usage")
  options.add_argument("--no-sandbox") if ENV["CI"]

  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

# Register headless Chrome driver
Capybara.register_driver :chrome_headless do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument("--headless=new")
  options.add_argument("--disable-search-engine-choice-screen")
  options.add_argument("--window-size=1400,1000")
  options.add_argument("--disable-gpu")
  options.add_argument("--no-sandbox")
  options.add_argument("--disable-dev-shm-usage")
  options.add_argument("--disable-blink-features=AutomationControlled")

  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

# Set default drivers
Capybara.default_driver = :rack_test
Capybara.javascript_driver = ENV["CI"].present? ? :chrome_headless : :chrome
