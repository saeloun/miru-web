# frozen_string_literal: true

Grover.configure do |config|
  config.options = {
    format: "A4",
    margin: {
      top: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
      right: "0.5in"
    },
    printBackground: true,
    preferCSSPageSize: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process"
    ],
    timeout: 60000, # 30 seconds timeout
    wait_until: "networkidle0",
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
