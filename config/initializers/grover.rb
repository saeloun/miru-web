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
    wait_until: "domcontentloaded"
  }
end
