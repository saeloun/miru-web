# frozen_string_literal: true

require "openssl"
require "rails_helper"

RSpec.describe PaymentProviders::RazorpayPayoutWebhookFulfillment do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:client) { create(:client, company:, currency: "INR") }
  let(:invoice) { create(:invoice, company:, client:, currency: "INR", status: "paid") }
  let(:payment) { create(:payment, invoice:, transaction_type: :razorpay, payment_currency: "INR") }
  let!(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::RAZORPAY_PROVIDER,
      enabled: true,
      connected: true,
      settings: {
        key_id: "rzp_test_123",
        key_secret: "secret",
        webhook_secret: "webhook_secret",
        payouts_enabled: true,
        payout_account_number: "7878780080316316",
        payout_upi_id: "vendor@upi"
      }
    )
  end
  let!(:payout) { create(:razorpay_payout, payment:, status: :processing, external_id: "pout_test_123") }
  let(:payload) do
    {
      event: "payout.processed",
      payload: {
        payout: {
          entity: {
            id: "pout_test_123",
            status: "processed",
            processed_at: Time.zone.local(2026, 4, 29, 12, 0, 0).to_i,
            failure_reason: nil
          }
        }
      }
    }.to_json
  end

  it "updates the local payout status when the signature is valid" do
    fulfillment = described_class.new(payload:, signature: sign(payload))

    expect(fulfillment.process).to be(true)
    expect(payout.reload).to be_processed
    expect(payout.processed_at).to be_present
  end

  it "uses the payout entity status for payout.updated webhook deliveries" do
    updated_payload = JSON.parse(payload)
    updated_payload["event"] = "payout.updated"
    updated_payload["payload"]["payout"]["entity"]["status"] = "queued"
    updated_payload["payload"]["payout"]["entity"]["processed_at"] = nil
    updated_payload = updated_payload.to_json

    fulfillment = described_class.new(payload: updated_payload, signature: sign(updated_payload))

    expect(fulfillment.process).to be(true)
    expect(payout.reload).to be_queued
  end

  it "normalizes rejected payout.updated webhook deliveries to failed" do
    updated_payload = JSON.parse(payload)
    updated_payload["event"] = "payout.updated"
    updated_payload["payload"]["payout"]["entity"]["status"] = "rejected"
    updated_payload["payload"]["payout"]["entity"]["failure_reason"] = "Beneficiary bank rejected payout"
    updated_payload = updated_payload.to_json

    fulfillment = described_class.new(payload: updated_payload, signature: sign(updated_payload))

    expect(fulfillment.process).to be(true)
    expect(payout.reload).to be_failed
    expect(payout.failure_reason).to eq("Beneficiary bank rejected payout")
  end

  it "stores nested status detail descriptions as the failure reason" do
    failed_payload = JSON.parse(payload)
    failed_payload["event"] = "payout.failed"
    failed_payload["payload"]["payout"]["entity"]["status"] = "failed"
    failed_payload["payload"]["payout"]["entity"]["failure_reason"] = nil
    failed_payload["payload"]["payout"]["entity"]["status_details"] = { "description" => "UPI handle is invalid" }
    failed_payload = failed_payload.to_json

    fulfillment = described_class.new(payload: failed_payload, signature: sign(failed_payload))

    expect(fulfillment.process).to be(true)
    expect(payout.reload).to be_failed
    expect(payout.failure_reason).to eq("UPI handle is invalid")
  end

  it "ignores unsupported payout events without mutating the payout" do
    unsupported_payload = JSON.parse(payload)
    unsupported_payload["event"] = "fund_account.created"
    unsupported_payload = unsupported_payload.to_json

    fulfillment = described_class.new(payload: unsupported_payload, signature: "not-checked")

    expect(fulfillment.process).to be(true)
    expect(payout.reload).to be_processing
    expect(payout.raw_response).to eq({})
  end

  it "rejects malformed payout payloads" do
    fulfillment = described_class.new(payload: "{bad-json", signature: "bad")

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid Razorpay webhook payload")
    expect(payout.reload).to be_processing
  end

  it "rejects webhook deliveries for unknown payout ids" do
    missing_payout_payload = JSON.parse(payload)
    missing_payout_payload["payload"]["payout"]["entity"]["id"] = "pout_missing"
    missing_payout_payload = missing_payout_payload.to_json

    fulfillment = described_class.new(payload: missing_payout_payload, signature: sign(missing_payout_payload))

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Razorpay payout not found")
    expect(payout.reload).to be_processing
  end

  it "rejects invalid signatures" do
    fulfillment = described_class.new(payload:, signature: "bad")

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid Razorpay webhook signature")
    expect(fulfillment.error_code).to eq(:invalid_signature)
    expect(payout.reload).to be_processing
  end

  def sign(body)
    OpenSSL::HMAC.hexdigest("SHA256", "webhook_secret", body)
  end
end
