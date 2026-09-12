# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalClient do
  let(:provider) do
    build(
      :payments_provider,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      settings: { client_id: "client-id", environment: "sandbox" }
    ).tap { |record| record.client_secret = "client-secret" }
  end
  let(:client) { described_class.new(provider:) }
  let(:base_url) { "https://api-m.sandbox.paypal.com" }

  around do |example|
    cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    example.run
  ensure
    Rails.cache = cache
  end

  before do
    Rails.cache.clear
    stub_request(:post, "#{base_url}/v1/oauth2/token")
      .with(basic_auth: ["client-id", "client-secret"], body: { grant_type: "client_credentials" })
      .to_return(status: 200, body: { access_token: "token-1", expires_in: 3600 }.to_json, headers: { "Content-Type" => "application/json" })
  end

  it "uses the live base URL outside sandbox" do
    provider.environment = "live"

    expect(client.base_url).to eq("https://api-m.paypal.com")
  end

  it "fetches and caches the access token" do
    expect(client.access_token).to eq("token-1")
    expect(described_class.new(provider:).access_token).to eq("token-1")
    expect(a_request(:post, "#{base_url}/v1/oauth2/token")).to have_been_made.once
  end

  it "asks PayPal again when the secret changes for the same client id" do
    expect(client.access_token).to eq("token-1")

    provider.client_secret = "rotated-secret"
    stub_request(:post, "#{base_url}/v1/oauth2/token")
      .with(basic_auth: ["client-id", "rotated-secret"])
      .to_return(status: 401, body: { error: "invalid_client", error_description: "Client Authentication failed" }.to_json)

    expect { described_class.new(provider:).access_token }.to raise_error(described_class::Error, "Client Authentication failed")
  end

  it "raises a readable error for bad credentials" do
    stub_request(:post, "#{base_url}/v1/oauth2/token")
      .to_return(status: 401, body: { error: "invalid_client", error_description: "Client Authentication failed" }.to_json)

    expect { client.access_token }.to raise_error(described_class::Error, "Client Authentication failed")
  end

  it "creates orders with an idempotency header" do
    stub_request(:post, "#{base_url}/v2/checkout/orders")
      .with(headers: { "Authorization" => "Bearer token-1", "PayPal-Request-Id" => "req-1" }, body: { intent: "CAPTURE" }.to_json)
      .to_return(status: 201, body: { id: "ORDER-1", status: "PAYER_ACTION_REQUIRED" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.create_order({ intent: "CAPTURE" }, request_id: "req-1")).to include("id" => "ORDER-1")
  end

  it "captures orders" do
    stub_request(:post, "#{base_url}/v2/checkout/orders/ORDER-1/capture")
      .with(headers: { "PayPal-Request-Id" => "cap-1" })
      .to_return(status: 201, body: { id: "ORDER-1", status: "COMPLETED" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.capture_order("ORDER-1", request_id: "cap-1")).to include("status" => "COMPLETED")
  end

  it "exposes the PayPal issue code on API errors" do
    stub_request(:post, "#{base_url}/v2/checkout/orders/ORDER-1/capture")
      .to_return(status: 422, body: { name: "UNPROCESSABLE_ENTITY", message: "The requested action could not be performed.", details: [{ issue: "ORDER_ALREADY_CAPTURED", description: "Order already captured." }] }.to_json)

    expect { client.capture_order("ORDER-1", request_id: "cap-1") }.to raise_error(described_class::Error) { |error|
      expect(error.issue).to eq("ORDER_ALREADY_CAPTURED")
      expect(error.message).to eq("Order already captured.")
    }
  end

  it "registers webhooks" do
    stub_request(:post, "#{base_url}/v1/notifications/webhooks")
      .with(body: { url: "https://app.miru.so/webhooks/paypal/events", event_types: [{ name: "PAYMENT.CAPTURE.COMPLETED" }, { name: "CHECKOUT.ORDER.APPROVED" }] }.to_json)
      .to_return(status: 201, body: { id: "WH-1" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.create_webhook(url: "https://app.miru.so/webhooks/paypal/events")).to include("id" => "WH-1")
  end

  it "lists and deletes webhooks" do
    stub_request(:get, "#{base_url}/v1/notifications/webhooks")
      .to_return(status: 200, body: { webhooks: [{ id: "WH-1", url: "https://app.miru.so/webhooks/paypal/events" }] }.to_json, headers: { "Content-Type" => "application/json" })
    stub_request(:delete, "#{base_url}/v1/notifications/webhooks/WH-1").to_return(status: 204, body: "")

    expect(client.list_webhooks.first["id"]).to eq("WH-1")
    expect(client.delete_webhook("WH-1")).to eq({})
  end

  it "verifies webhook signatures" do
    headers = {
      "PAYPAL-AUTH-ALGO" => "SHA256withRSA",
      "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
      "PAYPAL-TRANSMISSION-ID" => "tid-1",
      "PAYPAL-TRANSMISSION-SIG" => "sig-1",
      "PAYPAL-TRANSMISSION-TIME" => "2026-09-12T10:00:00Z"
    }
    body = { id: "WH-EVT-1", event_type: "PAYMENT.CAPTURE.COMPLETED" }.to_json
    stub_request(:post, "#{base_url}/v1/notifications/verify-webhook-signature")
      .with(body: {
        auth_algo: "SHA256withRSA",
        cert_url: "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
        transmission_id: "tid-1",
        transmission_sig: "sig-1",
        transmission_time: "2026-09-12T10:00:00Z",
        webhook_id: "WH-1",
        webhook_event: JSON.parse(body)
      }.to_json)
      .to_return(status: 200, body: { verification_status: "SUCCESS" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.verify_webhook_signature(headers:, body:, webhook_id: "WH-1")).to be(true)
  end

  it "raises when the provider has no credentials" do
    provider.settings = { client_id: "" }

    expect { client.access_token }.to raise_error(described_class::Error, "PayPal client ID and secret are required")
  end
end
