# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayPaymentLinkService do
  describe "#process" do
    let(:company) { create(:india_company, base_currency: "INR", name: "Saeloun") }
    let(:client) { create(:client, company:, currency: "INR") }
    let(:invoice) do
      create(
        :invoice,
        company:,
        client:,
        currency: "INR",
        invoice_number: "INV-42",
        amount: 1200,
        amount_due: 1200
      )
    end
    let(:provider) do
      create(
        :payments_provider,
        company:,
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true,
        connected: true,
        accepted_payment_methods: ["razorpay"],
        settings: {
          key_id: "rzp_test_123",
          key_secret: "secret",
          linked_account_id: "acc_test_123",
          platform_fee_percent: "5",
          route_transfers_enabled: true
        }
      )
    end
    let(:client_double) { instance_double(PaymentProviders::RazorpayClient) }

    before do
      allow(PaymentProviders::RazorpayClient)
        .to receive(:new)
        .with(provider:)
        .and_return(client_double)
    end

    it "creates a Razorpay Payment Link and stores the link details" do
      expect(client_double).to receive(:create_payment_link) do |payload|
        expect(payload[:amount]).to eq(120_000)
        expect(payload[:currency]).to eq("INR")
        expect(payload[:accept_partial]).to be(false)
        expect(payload[:reference_id]).to eq("miru-inv-#{invoice.id}")
        expect(payload.dig(:options, :order, :transfers, 0, :account)).to eq("acc_test_123")
        expect(payload.dig(:options, :order, :transfers, 0, :amount)).to eq(114_000)
        expect(payload.dig(:notes, :platform_fee_percent)).to eq("5.0")

        { "id" => "plink_test_123", "short_url" => "https://rzp.io/rzp/test" }
      end

      payment_url = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success"
      ).process

      expect(payment_url).to eq("https://rzp.io/rzp/test")
      expect(invoice.reload.razorpay_payment_link_id).to eq("plink_test_123")
      expect(invoice.razorpay_payment_link_url).to eq("https://rzp.io/rzp/test")
    end
  end
end
