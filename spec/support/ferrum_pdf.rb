# frozen_string_literal: true

# Configure FerrumPdf browser lazily for tests that need PDF generation.
# This avoids initializing Chrome during Rails boot, which can cause timeouts.

RSpec.configure do |config|
  config.before(:each, :pdf) do
    # Check if browser is already configured via class variable
    next if FerrumPdf.class_variable_defined?(:@@browser) && FerrumPdf.class_variable_get(:@@browser).present?

    browser_path = [
      ENV["CHROME_BIN"],
      ENV["BROWSER_PATH"],
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ].compact.find { |path| File.exist?(path) }

    if browser_path
      FerrumPdf.browser = Ferrum::Browser.new(
        headless: true,
        timeout: 60,
        process_timeout: 30,
        browser_path:,
        browser_options: {
          "no-sandbox" => nil,
          "disable-gpu" => nil,
          "disable-dev-shm-usage" => nil,
          "disable-setuid-sandbox" => nil
        }
      )
    end
  end

  config.after(:suite) do
    if FerrumPdf.class_variable_defined?(:@@browser)
      FerrumPdf.class_variable_get(:@@browser)&.quit
    end
  end
end
