# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayUpiPayoutService do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:provider) do
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
  let(:client) { instance_double(PaymentProviders::RazorpayClient) }

  before do
    allow(PaymentProviders::RazorpayClient).to receive(:new).with(provider:).and_return(client)
    allow(client).to receive(:create_upi_payout).and_return({ "id" => "pout_test_123" })
  end

  it "creates an idempotent UPI payout payload" do
    described_class.new(
      provider:,
      amount: 125.50,
      contact_name: "Vendor",
      contact_email: "vendor@example.com",
      contact_phone: "9876543210",
      reference_id: "miru-payout-1",
      idempotency_key: "idem-123"
    ).process

    expect(client).to have_received(:create_upi_payout).with(
      hash_including(
        account_number: "7878780080316316",
        amount: 12_550,
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: "miru-payout-1",
        fund_account: hash_including(
          account_type: "vpa",
          vpa: { address: "vendor@upi" }
        )
      ),
      idempotency_key: "idem-123"
    )
  end
end
