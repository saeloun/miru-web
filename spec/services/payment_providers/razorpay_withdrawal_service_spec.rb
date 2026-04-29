# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayWithdrawalService do
  let(:company) { create(:india_company, base_currency: "INR", business_phone: "9876543210") }
  let(:client) { create(:client, company:, currency: "INR", email: "client@example.com") }
  let(:invoice) { create(:invoice, company:, client:, currency: "INR", status: "paid") }
  let(:payment) { create(:payment, invoice:, transaction_type: :razorpay, payment_currency: "INR", amount: 1000) }
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
        payouts_enabled: true,
        payout_account_number: "7878780080316316",
        payout_upi_id: "vendor@upi",
        payout_purpose: "payout",
        payout_queue_if_low_balance: true
      }
    )
  end
  let(:payout_service) { instance_double(PaymentProviders::RazorpayUpiPayoutService) }

  before do
    allow(PaymentProviders::RazorpayUpiPayoutService).to receive(:new).and_return(payout_service)
    allow(payout_service).to receive(:process).and_return(
      {
        "id" => "pout_test_123",
        "status" => "queued",
        "failure_reason" => nil
      }
    )
  end

  it "creates a Razorpay payout attempt for a collected Razorpay payment" do
    payout = described_class.new(payment:, automatic: true).process

    expect(payout).to be_queued
    expect(payout.external_id).to eq("pout_test_123")
    expect(payout.amount).to eq(1000)
    expect(payout.recipient_upi_id).to eq("vendor@upi")
    expect(PaymentProviders::RazorpayUpiPayoutService).to have_received(:new).with(
      provider:,
      amount: 1000,
      recipient: hash_including(name: company.name, email: client.email, upi_id: "vendor@upi"),
      reference_id: payout.reference_id,
      idempotency_key: payout.idempotency_key
    )
  end

  it "returns the existing active payout instead of creating a duplicate" do
    existing = create(:razorpay_payout, payment:, status: :processing, external_id: "pout_existing")

    payout = described_class.new(payment:, automatic: true).process

    expect(payout).to eq(existing)
    expect(PaymentProviders::RazorpayUpiPayoutService).not_to have_received(:new)
  end

  it "records failed payout API responses for manual retry visibility" do
    allow(payout_service).to receive(:process).and_raise(PaymentProviders::RazorpayClient::Error, "Insufficient balance")

    payout = described_class.new(payment:, automatic: false).process

    expect(payout).to be_failed
    expect(payout.failure_reason).to eq("Insufficient balance")
  end

  it "does nothing for automatic payout when payouts are disabled" do
    provider.update!(settings: provider.settings.merge("payouts_enabled" => false))

    expect(described_class.new(payment:, automatic: true).process).to be_nil
    expect(payment.razorpay_payouts).to be_empty
  end

  it "rejects manual withdrawal for non-Razorpay payments" do
    payment.update!(transaction_type: :upi)

    expect {
      described_class.new(payment:, automatic: false).process
    }.to raise_error(PaymentProviders::RazorpayWithdrawalService::Error, /Only Razorpay payments/)
  end
end
