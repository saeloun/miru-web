# frozen_string_literal: true

require "zerobounce"

Zerobounce.configure do |config|
  config.apikey = ENV["ZERO_BOUNCE_API_KEY"]

  # Configure HTTP timeouts for safer timeout handling
  # The zerobounce gem uses RestClient under the hood
  config.timeout = 5 if config.respond_to?(:timeout=)
  config.open_timeout = 5 if config.respond_to?(:open_timeout=)
  config.read_timeout = 5 if config.respond_to?(:read_timeout=)
end

# Configure RestClient default timeouts as fallback
# if the gem doesn't expose timeout configuration
if defined?(RestClient)
  RestClient::Request.class_eval do
    alias_method :original_execute, :execute

    def execute(&block)
      @timeout ||= 5
      @open_timeout ||= 5
      @read_timeout ||= 5
      original_execute(&block)
    end
  end
end
