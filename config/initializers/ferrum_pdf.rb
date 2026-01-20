# frozen_string_literal: true

# FerrumPdf Configuration
#
# This initializer configures FerrumPdf, which uses Ferrum (a headless Chrome driver)
# to generate PDF documents from HTML content. This is used throughout the application
# for generating invoice PDFs and other printable documents.
#
# Configuration includes:
# - Page rendering options (wait times, retries)
# - PDF layout options (margins)
#
# Environment Variables:
# - CHROME_BIN: Path to Chrome/Chromium browser (set in Docker containers)
# - BROWSER_PATH: Custom override for browser path
#
# Note: Test environment skips browser initialization; tests should mock PDF generation
# or use the :pdf RSpec tag with spec/support/ferrum_pdf.rb for lazy initialization.

# Configure global FerrumPdf options for PDF generation
FerrumPdf.configure do |config|
  # Wait up to 30 seconds for page to become idle before rendering
  config.page_options.wait_for_idle_options = { timeout: 30 }

  # Retry page rendering up to 2 times on failure
  config.page_options.retries = 2

  # Set default PDF margins to 0.5 inches on all sides (Chrome DevTools Protocol format)
  config.pdf_options.margin_top = 0.5
  config.pdf_options.margin_bottom = 0.5
  config.pdf_options.margin_left = 0.5
  config.pdf_options.margin_right = 0.5
end

# Skip browser initialization during rake tasks and test environment
# The browser will be initialized lazily when actually needed for PDF generation
unless defined?(Rake) && Rake.application.top_level_tasks.any? || Rails.env.test?
  # Configure browser for production and containerized environments
  if Rails.env.production? || ENV["DOCKER_CONTAINER"]
    # Try common Chrome/Chromium installation paths for Docker/production
    # Order matters: check most specific paths first
    browser_path = [
      ENV["CHROME_BIN"], # Environment variable (used in Docker containers)
      "/usr/bin/chromium", # Debian/Ubuntu chromium package (Dockerfile.local)
      "/usr/bin/chromium-browser", # Alternative chromium package name
      "/usr/bin/google-chrome-stable", # Google Chrome stable (production/CI)
      "/usr/bin/google-chrome" # Google Chrome
    ].compact.find { |path| File.exist?(path) }

    if browser_path
      FerrumPdf.browser = Ferrum::Browser.new(
        headless: true, # Run browser in headless mode (no GUI)
        timeout: 60, # Maximum time to wait for browser operations
        process_timeout: 60, # Maximum time to wait for browser process to start
        browser_path:, # Use the auto-detected browser path
        browser_options: {
          # Disable sandbox for containerized environments (e.g., Docker)
          "no-sandbox" => nil,
          # Disable GPU acceleration (not needed in headless mode)
          "disable-gpu" => nil,
          # Use /tmp instead of /dev/shm for shared memory (helps in containers with limited shm)
          "disable-dev-shm-usage" => nil,
          # Disable setuid sandbox (required in some containerized environments)
          "disable-setuid-sandbox" => nil
        }
      )
    end
  # Development environment: Auto-detect Chrome/Chromium installation
  elsif Rails.env.development?
    # Try common Chrome/Chromium installation paths
    browser_path = [
      ENV["BROWSER_PATH"], # Custom override
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", # macOS
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium"
    ].compact.find { |path| File.exist?(path) }

    # Configure browser if a valid Chrome/Chromium installation was found
    if browser_path
      FerrumPdf.browser = Ferrum::Browser.new(
        headless: true, # Run browser in headless mode
        timeout: 60, # Maximum time to wait for browser operations
        process_timeout: 60, # Maximum time to wait for browser process to start
        browser_path: # Use the auto-detected browser path
      )
    end
  end
end
