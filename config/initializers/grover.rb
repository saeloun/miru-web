# frozen_string_literal: true

Grover.configure do |config|
  config.options = {
    format: "A4",
    margin: {
      top: "5px",
      bottom: "5px"
    },
    prefer_css_page_size: true,
    emulate_media: "screen",
    cache: false,
    timeout: 30000, # Timeout in ms. A value of `0` means 'no timeout'
    wait_until: "domcontentloaded",
    launch_args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      # Additional performance flags
      "--disable-gpu", # Disable GPU acceleration
      "--single-process", # Run in single process mode to reduce memory
      "--no-zygote" # Disable zygote process
    ],
    javascript_enabled: false
  }

  if !(Rails.env.development? || Rails.env.test?)
    config.options[:executable_path] = "google-chrome"
  end
end
