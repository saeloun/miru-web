# frozen_string_literal: true

Sidekiq.configure_client do |config|
  config.redis = {
    url: ENV["REDIS_URL"], size: 4, network_timeout: 5,
    ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
  }
end

Sidekiq.configure_server do |config|
  config.redis = {
    url: ENV["REDIS_URL"], size: 4, network_timeout: 5,
    ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
  }
end
