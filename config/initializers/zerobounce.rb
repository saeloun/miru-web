# frozen_string_literal: true

require "zerobounce"

Zerobounce.configure do |config|
  config.apikey = ENV["ZERO_BOUNCE_API_KEY"]
end
