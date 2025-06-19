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
    timeout: 60000, # Timeout in ms. A value of `0` means 'no timeout'
    wait_until: "domcontentloaded",
    launch_args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage", # Critical for low memory
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--no-first-run",
      "--safebrowsing-disable-auto-update",
      "--disable-ipc-flooding-protection",
      # Memory limits
      "--memory-pressure-off",
      "--max_old_space_size=256", # Limit V8 heap to 256MB
      "--aggressive-cache-discard",
      # Remove these problematic flags:
      # "--single-process"  - Actually uses MORE memory
      # "--no-zygote"      - Slower startup
    ],
    javascript_enabled: false,
    print_background: false, # Reduce memory for backgrounds
    display_header_footer: false #
  }

  if !(Rails.env.development? || Rails.env.test?)
    config.options[:executable_path] = "/usr/bin/google-chrome"
  end
end
