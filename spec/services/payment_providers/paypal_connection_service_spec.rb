# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalConnectionService do
  let(:company) { create(:company) }
  let(:provider) do
    build(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      accepted_payment_methods: ["paypal"],
      settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true }
    ).tap { |record| record.client_secret = "client-secret" }
  end
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:webhook_url) { "https://app.miru.so/webhooks/paypal/events" }
  let(:service) { described_class.new(provider:, webhook_url:) }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "verifies credentials, registers the webhook and saves the provider as connected" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).with(url: webhook_url).and_return("id" => "WH-1")

    expect(service.process).to be(true)
    expect(provider.reload).to have_attributes(connected: true, enabled: true)
    expect(provider.webhook_id).to eq("WH-1")
    expect(provider.webhook_client_id).to eq("client-id")
    expect(provider.webhook_environment).to eq("sandbox")
    expect(provider.webhook_error).to be_nil
  end

  it "reuses an existing webhook when the URL is already registered" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).and_raise(PaymentProviders::PaypalClient::Error.new("exists", issue: "WEBHOOK_URL_ALREADY_EXISTS"))
    allow(client).to receive(:list_webhooks).and_return([{ "id" => "WH-OLD", "url" => webhook_url }])

    expect(service.process).to be(true)
    expect(provider.webhook_id).to eq("WH-OLD")
  end

  it "skips webhook registration for non-https URLs and records why" do
    allow(client).to receive(:access_token).and_return("token")
    expect(client).not_to receive(:create_webhook)

    expect(described_class.new(provider:, webhook_url: "http://localhost:3000/webhooks/paypal/events").process).to be(true)
    expect(provider.webhook_id).to be_nil
    expect(provider.webhook_error).to eq("Webhook registration needs a public HTTPS URL")
    expect(provider.connected).to be(true)
  end

  it "keeps the connection but records a webhook failure" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).and_raise(PaymentProviders::PaypalClient::Error.new("Webhook URL is invalid", issue: "WEBHOOK_URL_INVALID"))

    expect(service.process).to be(true)
    expect(provider.connected).to be(true)
    expect(provider.webhook_error).to eq("Webhook URL is invalid")
  end

  it "does not re-register when the webhook matches the current credentials" do
    provider.settings.merge!("webhook_id" => "WH-1", "webhook_client_id" => "client-id", "webhook_environment" => "sandbox")
    allow(client).to receive(:access_token).and_return("token")
    expect(client).not_to receive(:create_webhook)

    expect(service.process).to be(true)
  end

  it "saves a disconnected, disabled provider when credentials are rejected" do
    allow(client).to receive(:access_token).and_raise(PaymentProviders::PaypalClient::Error.new("Client Authentication failed"))

    expect(service.process).to be(false)
    expect(service.error).to eq("Client Authentication failed")
    expect(provider.reload).to have_attributes(connected: false, enabled: false)
  end

  it "saves without verification when credentials are absent" do
    provider.settings = { "environment" => "sandbox" }
    provider.enabled = false
    expect(client).not_to receive(:access_token)

    expect(service.process).to be(true)
    expect(provider.reload.connected).to be(false)
  end

  describe "#disconnect!" do
    it "deletes the webhook best-effort and destroys the provider" do
      provider.settings["webhook_id"] = "WH-1"
      provider.connected = true
      provider.save!
      allow(client).to receive(:delete_webhook).with("WH-1").and_raise(PaymentProviders::PaypalClient::Error.new("gone"))

      expect { service.disconnect! }.to change(PaymentsProvider, :count).by(-1)
    end
  end
end
