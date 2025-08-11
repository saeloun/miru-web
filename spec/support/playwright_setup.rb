# frozen_string_literal: true

require 'playwright'

# Configure Playwright as a custom Capybara driver
Capybara.register_driver :playwright_chromium do |app|
  # Start Playwright browser
  playwright = Playwright.create(playwright_cli_executable_path: 'pnpm exec playwright')
  browser = playwright.chromium.launch(headless: !ENV['HEADED'])
  
  # Create a custom driver that wraps Playwright
  Class.new do
    def initialize(app)
      @app = app
      @browser = browser
      @page = nil
    end
    
    def visit(path)
      @page = @browser.new_page
      @page.goto("http://#{Capybara.server_host}:#{Capybara.server_port}#{path}")
    end
    
    def current_url
      @page&.url
    end
    
    def body
      @page&.content
    end
    
    def find_css(selector)
      @page&.query_selector_all(selector) || []
    end
    
    def click_element(element)
      element.click if element.respond_to?(:click)
    end
    
    def quit
      @browser&.close
    end
    
    def page
      @page
    end
  end.new(app)
end

# Simple Playwright integration using direct API calls
module PlaywrightSystemHelpers
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    def use_playwright_driver
      driven_by :playwright_chromium
    end
  end
  
  def wait_for_react_app
    # Wait for React app to be mounted
    expect(page).to have_css('[data-testid="app-root"]', wait: 10)
    expect(page).to have_css('[data-component="App"]', wait: 5)
  end
  
  def wait_for_vite_assets
    # Wait for Vite to compile and serve assets
    sleep(2) # Give Vite time to compile
    expect(page).to have_css('script[src*="application"]', wait: 10)
  rescue
    # Fallback - just wait a bit more
    sleep(3)
  end
end

RSpec.configure do |config|
  config.include PlaywrightSystemHelpers, type: :system
end