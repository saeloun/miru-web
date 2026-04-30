# frozen_string_literal: true

require "rails_helper"

RSpec.describe Subscriptions::StripeLinkCliPaymentOption do
  let(:company) { create(:company, name: "Agent Ops") }
  let(:user) { create(:user, email: "agent-buyer@example.com") }

  it "builds a Link CLI spend request payload for Miru Pro checkout" do
    payload = described_class.new(
      company:,
      user:,
      interval: "monthly",
      quantity: 4,
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_123",
      base_url: "https://app.miru.so"
    ).payload

    expect(payload).to include(
      "provider" => "stripe_link_cli",
      "supported" => true,
      "credential_type" => "virtual_card"
    )
    expect(payload["merchant"]).to include(
      "name" => "Miru",
      "url" => "https://checkout.stripe.com/c/pay/cs_test_123"
    )
    expect(payload["spend_request"]).to include(
      "amount" => 400,
      "currency" => "usd"
    )
    expect(payload["spend_request"]["context"].length).to be >= 100
    expect(payload.dig("commands", "create_spend_request")).to include(
      "link-cli spend-request create",
      "--amount 400",
      "--request-approval",
      "--format json"
    )
    expect(payload.dig("commands", "test_mode")).to include("--test")
  end

  it "marks oversized Link CLI spend requests as unsupported" do
    payload = described_class.new(
      company:,
      user:,
      interval: "yearly",
      quantity: 51,
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_123",
      base_url: "https://app.miru.so"
    ).payload

    expect(payload["supported"]).to be(false)
    expect(payload["unsupported_reason"]).to include("50000 cents")
  end

  it "advertises the checkout endpoint in signup discovery payloads" do
    payload = described_class.signup_payload

    expect(payload).to include(
      "provider" => "stripe_link_cli",
      "checkout_endpoint" => "/api/v1/subscription/checkout",
      "requires_authenticated_workspace" => true
    )
    expect(payload.dig("checkout_request", "body")).to include(
      "agent_payment" => "stripe_link_cli",
      "interval" => "monthly"
    )
  end
end
