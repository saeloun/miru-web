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

  around { |example| VCR.turned_off { example.run } }

  describe "#create_payment_link" do
    it "creates payment links through the SDK request layer with JSON payloads" do
      payload = { amount: 1000, currency: "INR" }
      request = stub_request(:post, "https://api.razorpay.com/v1/payment_links").with(body: payload.to_json,
        headers: { "Content-Type" => "application/json" }, basic_auth: ["rzp_test_123", "secret"])
        .to_return(status: 200, body: { id: "plink_test_123" }.to_json, headers: { "Content-Type" => "application/json" })

      expect(client.create_payment_link(payload)).to eq("id" => "plink_test_123")
      expect(request).to have_been_requested.once
    end
  end

  describe "#fetch_payment_link" do
    it "fetches a Payment Link through the official SDK request layer" do
      stub_request(:get, "https://api.razorpay.com/v1/payment_links/plink_test_123")
        .to_return(status: 200, body: { id: "plink_test_123", status: "paid" }.to_json, headers: { "Content-Type" => "application/json" })

      expect(client.fetch_payment_link("plink_test_123")).to eq("id" => "plink_test_123", "status" => "paid")
    end

    it "treats a non-JSON gateway response as an unconfirmed outcome" do
      VCR.turned_off do
        stub_request(:get, "https://api.razorpay.com/v1/payment_links/plink_test_123")
          .to_return(status: 502, body: "<html>gateway unavailable</html>", headers: { "Content-Type" => "text/html" })
        expect { client.fetch_payment_link("plink_test_123") }.to raise_error(described_class::Error, /could not be confirmed/)
      end
    end
  end

  describe "#notify_payment_link" do
    it "uses the official Razorpay Payment Link notify endpoint" do
      stub_request(:post, "https://api.razorpay.com/v1/payment_links/plink_test_123/notify_by/sms")
        .to_return(status: 200, body: { success: true }.to_json, headers: { "Content-Type" => "application/json" })

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
