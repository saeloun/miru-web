# frozen_string_literal: true

FerrumPdf.configure do |config|
  config.page_options.wait_for_idle_options = { timeout: 30 }
  config.page_options.retries = 2
  config.pdf_options.margin_top = 0.5
  config.pdf_options.margin_bottom = 0.5
  config.pdf_options.margin_left = 0.5
  config.pdf_options.margin_right = 0.5
end

if Rails.env.production?
  FerrumPdf.browser = Ferrum::Browser.new(
    headless: true,
    timeout: 60,
    process_timeout: 60,
    browser_path: "/usr/bin/google-chrome-stable",
    browser_options: {
      "no-sandbox" => nil,
      "disable-gpu" => nil,
      "disable-dev-shm-usage" => nil,
      "disable-setuid-sandbox" => nil
    }
  )
end
