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
    timeout: 0, # Timeout in ms. A value of `0` means 'no timeout'
    wait_until: "domcontentloaded",
    launch_args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }

  if !(Rails.env.development? || Rails.env.test?)
    config.options[:executable_path] = "google-chrome"
  end
end
