# frozen_string_literal: true

require "openssl"
require "rails_helper"

RSpec.describe PaymentProviders::RazorpayClient do
  let(:provider) do
    build(
      :payments_provider,
      name: PaymentsProvider::RAZORPAY_PROVIDER,
      enabled: true,
      connected: true,
      settings: {
        key_id: "rzp_test_123",
        key_secret: "secret"
      }
    )
  end
  let(:client) { described_class.new(provider:) }

  describe "#create_payment_link" do
    it "creates payment links through the SDK request layer with JSON payloads" do
      payload = { amount: 1000, currency: "INR" }
      request = instance_double(Razorpay::Request)
      response = instance_double(HTTParty::Response, parsed_response: { "id" => "plink_test_123" })

      expect(Razorpay::Request).to receive(:new).with("payment_links").and_return(request)
      expect(request).to receive(:request)
        .with(:post, "/v1/payment_links", payload.to_json)
        .and_return(response)

      expect(client.create_payment_link(payload)).to eq("id" => "plink_test_123")
    end
  end

  describe "#fetch_payment_link" do
    it "uses the official Razorpay Payment Link SDK resource" do
      response = instance_double(Razorpay::Entity, attributes: { "id" => "plink_test_123", "status" => "paid" })

      expect(Razorpay::PaymentLink).to receive(:fetch).with("plink_test_123").and_return(response)

      expect(client.fetch_payment_link("plink_test_123")).to eq("id" => "plink_test_123", "status" => "paid")
    end
  end

  describe "#notify_payment_link" do
    it "uses the official Razorpay Payment Link notify endpoint" do
      response = instance_double(Razorpay::Entity, attributes: { "success" => true })

      expect(Razorpay::PaymentLink).to receive(:notify_by).with("plink_test_123", "sms").and_return(response)

      expect(client.notify_payment_link("plink_test_123", "sms")).to eq("success" => true)
    end
  end

  describe "#verify_payment_link_signature" do
    let(:signature_payload) { "plink_test_123|miru-inv-1|paid|pay_test_123" }
    let(:signature) { OpenSSL::HMAC.hexdigest("SHA256", "secret", signature_payload) }
    let(:attributes) do
      {
        payment_link_id: "plink_test_123",
        payment_link_reference_id: "miru-inv-1",
        payment_link_status: "paid",
        razorpay_payment_id: "pay_test_123",
        razorpay_signature: signature
      }
    end

    it "verifies a Payment Link callback signature with the SDK helper" do
      expect(client.verify_payment_link_signature(attributes)).to be(true)
    end

    it "rejects an invalid Payment Link callback signature" do
      attributes[:razorpay_signature] = "bad"

      expect(client.verify_payment_link_signature(attributes)).to be(false)
    end
  end

  describe "#verify_webhook_signature" do
    let(:payload) { { event: "payment_link.paid" }.to_json }
    let(:signature) { OpenSSL::HMAC.hexdigest("SHA256", "webhook_secret", payload) }

    it "verifies a webhook signature with the SDK helper" do
      expect(
        client.verify_webhook_signature(
          payload:,
          signature:,
          webhook_secret: "webhook_secret"
        )
      ).to be(true)
    end

    it "rejects an invalid webhook signature" do
      expect(
        client.verify_webhook_signature(
          payload:,
          signature: "bad",
          webhook_secret: "webhook_secret"
        )
      ).to be(false)
    end
  end

  describe "#create_upi_payout" do
    it "uses Razorpay's SDK request layer for payout composite calls" do
      payload = { account_number: "123", amount: 100, currency: "INR", mode: "UPI" }
      request = instance_double(Razorpay::Request)
      response = instance_double(Razorpay::Entity, attributes: { "id" => "pout_test_123" })

      expect(Razorpay::Request).to receive(:new).with("payouts").and_return(request)
      expect(request).to receive(:create).with(payload).and_return(response)

      expect(client.create_upi_payout(payload, idempotency_key: "idem-123")).to eq("id" => "pout_test_123")
    end
  end
end
