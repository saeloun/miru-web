# frozen_string_literal: true

module RazorpayOauthHelpers
  TOKEN_URL = "https://auth.razorpay.com/token"
  REVOKE_URL = "https://auth.razorpay.com/revoke"
  WEBHOOK_SECRET = "synthetic-webhook-secret"

  def stub_razorpay_oauth_env(**overrides)
    allow(ENV).to receive(:[]).and_call_original
    { "ENABLED" => "true", "CLIENT_ID" => "synthetic-client", "CLIENT_SECRET" => "synthetic-secret", "MODE" => "test",
      "REDIRECT_URI" => "https://app.miru.example/payments/razorpay/callback", "WEBHOOK_SECRET" => WEBHOOK_SECRET,
      "COLLECTIONS_ENABLED" => "true" }.merge(overrides.stringify_keys).each do |key, value|
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_#{key}").and_return(value)
    end
  end

  def razorpay_oauth_tokens(**overrides)
    { token_type: "Bearer", access_token: "synthetic-access", refresh_token: "synthetic-refresh",
      public_token: "rzp_test_oauth_synthetic", expires_in: 3600, razorpay_account_id: "acc_synthetic" }.merge(overrides)
  end

  def stub_razorpay_token(body: razorpay_oauth_tokens, status: 200)
    stub_request(:post, TOKEN_URL).to_return(status:, body: body.is_a?(String) ? body : body.to_json)
  end

  def stub_razorpay_created_link(link, headers: {})
    body = link.deep_stringify_keys
    url = "https://api.razorpay.com/v1/payment_links"
    creation = stub_request(:post, url)
    creation.with(headers:) unless headers.empty?
    creation.to_return do |request|
      body = body.merge("reference_id" => JSON.parse(request.body).fetch("reference_id"))
      { status: 200, body: body.to_json, headers: { "Content-Type" => "application/json" } }
    end
    stub_request(:get, "#{url}/#{body.fetch('id')}").to_return do
      { status: 200, body: body.to_json, headers: { "Content-Type" => "application/json" } }
    end
    creation
  end

  def razorpay_rejection(description)
    { error: { code: "BAD_REQUEST_ERROR", description: } }
  end

  def connect_razorpay_oauth(provider, actor)
    stub_razorpay_token
    connection = PaymentProviders::RazorpayOauthConnection.new(provider:, actor:)
    state = connection.start!
    connection.complete!(state:, browser_state: state, code: "synthetic-code")
    provider.reload
  end

  def razorpay_oauth_status(provider, actor = nil)
    PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor:).status
  end

  def post_razorpay_oauth_event(body, secret: WEBHOOK_SECRET, signature: nil, event_id: "evt_synthetic")
    raw = body.is_a?(String) ? body : body.to_json
    post "/webhooks/razorpay/oauth", params: raw, headers: {
      "CONTENT_TYPE" => "application/json", "X-Razorpay-Event-Id" => event_id,
      "X-Razorpay-Signature" => signature || OpenSSL::HMAC.hexdigest("SHA256", secret, raw)
    }
  end
end

RSpec.configure { |config| config.include RazorpayOauthHelpers }
