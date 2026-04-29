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
