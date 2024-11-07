# frozen_string_literal: true

Grover.configure do |config|
  config.options = {
    format: "A4",
    margin: {
      top: "5px",
      bottom: "5px"
    },
    prefer_css_page_size: false,
    emulate_media: "screen",
    cache: false,
    timeout: 30000,
    wait_until: "domcontentloaded",
    launch_args: ["--no-sandbox", "--disable-setuid-sandbox"],
    viewport: { width: 800, height: 600 },
    javascript_enabled: false
  }

  if !(Rails.env.development? || Rails.env.test?)
    config.options[:executable_path] = "google-chrome"
  end
end
