# frozen_string_literal: true

class Rack::Attack
  self.enabled = false if Rails.env.test?

  self.cache.store =
    if Rails.cache.is_a?(ActiveSupport::Cache::NullStore)
      ActiveSupport::Cache::MemoryStore.new
    else
      Rails.cache
    end

  throttle("auth/login/ip", limit: 20, period: 1.minute) do |req|
    req.ip if req.post? && req.path == "/api/v1/users/login"
  end

  throttle("auth/recovery/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && [
      "/api/v1/users/forgot_password",
      "/api/v1/users/resend_confirmation_email",
      "/api/v1/users/passkeys/authenticate"
    ].include?(req.path)
  end

  throttled_response = lambda do |_env|
    [429, { "Content-Type" => "application/json" }, [{ error: "Too many requests. Please try again later." }.to_json]]
  end

  self.throttled_responder = throttled_response
end
