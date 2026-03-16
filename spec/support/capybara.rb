# frozen_string_literal: true

require "capybara/rails"
require "capybara/rspec"
require "capybara/cuprite"

# Configure Capybara
Capybara.server = :puma, { Silent: true }
Capybara.default_max_wait_time = 10
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

cuprite_options = {
  headless: ENV["HEADED"].blank?,
  window_size: [1400, 1000],
  url_blacklist: [
    %r{\Ahttps://fonts\.googleapis\.com/},
    %r{\Ahttps://fonts\.gstatic\.com/},
    %r{\Ahttps://cdn\.jsdelivr\.net/},
    %r{\Ahttps://www\.googletagmanager\.com/},
  ],
  browser_options: {
    "disable-web-security" => nil,
    "allow-insecure-localhost" => nil,
    "disable-blink-features" => "AutomationControlled",
    "disable-dev-shm-usage" => nil,
    "disable-gpu" => nil,
    "disable-setuid-sandbox" => nil,
    "disable-software-rasterizer" => nil,
    "no-sandbox" => nil,
  },
  process_timeout: ENV["CI"].present? ? 120 : 60,
  timeout: 20,
  js_errors: false,
  pending_connection_errors: false,
}

Capybara.register_driver :cuprite do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options)
end

Capybara.register_driver :cuprite_headless do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options.merge(headless: true))
end

# Set default drivers
Capybara.default_driver = ENV["CI"].present? ? :cuprite_headless : :cuprite
Capybara.javascript_driver = ENV["CI"].present? ? :cuprite_headless : :cuprite

# Override selenium-style driver names to use Cuprite
Capybara.register_driver :selenium_chrome_headless do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options.merge(headless: true))
end

Capybara.register_driver :selenium_chrome do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options.merge(headless: false))
end

Capybara.register_driver :chrome_headless do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options.merge(headless: true))
end

Capybara.register_driver :chrome do |app|
  Capybara::Cuprite::Driver.new(app, **cuprite_options.merge(headless: false))
end
