# frozen_string_literal: true

RSpec.configure do |config|
  config.append_before(:each, type: :system) do |example|
    if example.metadata[:js]
      Capybara.current_driver = ENV["CI"].present? ? :playwright_headless : :playwright
    else
      Capybara.current_driver = :rack_test
    end

    Capybara.javascript_driver = ENV["CI"].present? ? :playwright_headless : :playwright
  end

  config.after(:each, type: :system) do |example|
    if example.exception && page
      timestamp = Time.now.strftime("%Y%m%d%H%M%S")
      screenshot_name = "failure_#{timestamp}.png"
      begin
        page.save_screenshot(Rails.root.join("tmp", "capybara", screenshot_name))
        puts "Screenshot saved: tmp/capybara/#{screenshot_name}"
      rescue StandardError => e
        puts "Could not save screenshot: #{e.message}"
      end
    end

    Capybara.reset_sessions!
    Capybara.use_default_driver
  end

  config.include Capybara::DSL, type: :system
  config.include Capybara::RSpecMatchers, type: :system
end

module Capybara
  module DSL
    def needs_server?
      true
    end
  end
end

def needs_server?
  true
end
