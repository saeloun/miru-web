# frozen_string_literal: true

# Ferrum PDF configuration
# Ferrum PDF automatically handles Chrome/Chromium detection across platforms
# It will use the system's installed Chrome/Chromium browser

FerrumPdf.configure do |config|
  # Use headless mode for PDF generation
  config.browser_options = {
    headless: true,
    timeout: 30,
    browser_options: {
      'no-sandbox': true,
      'disable-gpu': true,
      'disable-dev-shm-usage': true,
      'disable-setuid-sandbox': true
    }
  }

  # PDF generation options
  config.pdf_options = {
    format: "A4",
    margin: {
      top: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
      right: "0.5in"
    },
    print_background: true,
    prefer_css_page_size: true,
    display_header_footer: false
  }

  # Set timeout for PDF generation
  config.timeout = 30000 # 30 seconds
end
