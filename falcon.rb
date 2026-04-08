#!/usr/bin/env -S falcon host
# frozen_string_literal: true

require "falcon/environment/rack"

hostname = File.basename(__dir__)

service hostname do
  include Falcon::Environment::Rack

  count ENV.fetch("WEB_CONCURRENCY", 1).to_i
  preload "preload.rb"
  port { ENV.fetch("PORT", 3000).to_i }

  endpoint do
    Async::HTTP::Endpoint
      .parse("http://0.0.0.0:#{port}")
      .with(protocol: Async::HTTP::Protocol::HTTP11)
  end
end
