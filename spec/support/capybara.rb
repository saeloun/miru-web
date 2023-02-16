# frozen_string_literal: true

require "capybara/rails"
require "capybara/rspec"

Capybara.server = :puma

if ENV["CI"].present?
  Capybara.register_driver :chrome_headless do |app|
    options = Selenium::WebDriver::Chrome::Options.new(args: %w[headless window-size=1400,1000])

    if ENV["HUB_URL"]
      Capybara::Selenium::Driver.new(
        app,
        browser: :remote,
        url: ENV["HUB_URL"],
        capabilities: options,
        timeout: 120)
    end
  end

  Capybara.default_driver = :chrome_headless
  Capybara.javascript_driver = :chrome_headless
else
  Capybara.default_driver = :selenium_chrome
  Capybara.javascript_driver = :selenium_chrome
end
