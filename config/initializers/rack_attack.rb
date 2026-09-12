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

  throttle("auth/signup/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.post? && req.path == "/api/v1/users/signup"
  end

  throttle("analytics/pdf/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.get? && req.path.match?(%r{\A/internal_api/v1/analytics/exports/[^/]+\.pdf\z})
  end

  throttle("reports/pdf/ip", limit: 5, period: 1.minute) do |req|
    next unless req.get? && req.path.match?(%r{\A/api/v1/reports/[^/]+/download(?:\.pdf)?\z})

    req.ip if req.path.end_with?(".pdf") || req.GET["format"] == "pdf"
  end

  throttle("invitations/resend/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.post? && req.path.match?(%r{\A/api/v1/invitations/\d+/resend\z})
  end

  throttle("invoice/checkout/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.get? && req.path.match?(%r{\A/invoices/[^/]+/payments/(new|paypal_return)\z})
  end

  throttle("auth/recovery/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && [
      "/api/v1/users/forgot_password",
      "/api/v1/users/resend_confirmation_email",
      "/api/v1/users/passkeys/authenticate",
      "/api/v1/users/otp/request",
      "/api/v1/users/otp/verify",
      "/api/v1/users/totp/authenticate",
      "/api/v1/mobile/otp/request",
      "/api/v1/mobile/otp/verify"
    ].include?(req.path)
  end

  throttle("auth/otp/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && [
      "/api/v1/users/totp/authenticate",
      "/api/v1/users/otp/verify"
    ].include?(req.path)
  end

  throttled_response = lambda do |_env|
    [429, { "Content-Type" => "application/json" }, [{ error: "Too many requests. Please try again later." }.to_json]]
  end

  self.throttled_responder = throttled_response
end
