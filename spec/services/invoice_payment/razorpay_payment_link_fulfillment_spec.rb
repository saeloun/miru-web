# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::RazorpayPaymentLinkFulfillment do
  describe "#process" do
    let(:company) { create(:india_company, base_currency: "INR") }
    let(:client) { create(:client, company:, currency: "INR", name: "Acme", email: "client@example.com") }
    let(:invoice) do
      create(
        :invoice,
        company:,
        client:,
        currency: "INR",
        amount: 1000,
        amount_due: 1000,
        amount_paid: 0,
        status: "sent",
        payment_infos: {
          "razorpay_payment_link_id" => "plink_test_123",
          "razorpay_payment_link_url" => "https://rzp.io/rzp/test"
        }
      )
    end
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
          enabled_on_invoices: true
        }
      )
    end
    let(:payment_link_status) { "paid" }
    let(:payment_id) { "pay_test_123" }
    let(:signature) { "valid-signature" }
    let(:callback_params) do
      {
        razorpay_payment_link_id: "plink_test_123",
        razorpay_payment_link_reference_id: "miru-inv-#{invoice.id}",
        razorpay_payment_link_status: payment_link_status,
        razorpay_payment_id: payment_id,
        razorpay_signature: signature
      }
    end
    let(:client_double) { instance_double(PaymentProviders::RazorpayClient) }

    before do
      allow(PaymentProviders::RazorpayClient)
        .to receive(:new)
        .with(provider:)
        .and_return(client_double)
      allow(client_double).to receive(:verify_payment_link_signature).and_return(true)
      allow(PaymentMailer).to receive_message_chain(:with, :payment, :deliver_later)
      allow_any_instance_of(Invoice).to receive(:send_to_client_email)
    end

    it "settles the invoice after verifying the Razorpay callback" do
      allow(client_double).to receive(:fetch_payment_link).with("plink_test_123").and_return(
        {
          "status" => "paid",
          "amount_paid" => 100_000,
          "updated_at" => Time.zone.local(2026, 4, 28).to_i,
          "customer" => { "name" => "Acme" }
        }
      )

      result = nil

      expect {
        result = described_class.process(invoice:, params: callback_params)
      }.to have_enqueued_job(RazorpayPayoutJob)

      expect(result).to be(true)

      payment = Payment.last
      expect(payment.invoice).to eq(invoice)
      expect(payment.transaction_type).to eq("razorpay")
      expect(payment.amount).to eq(1000)
      expect(invoice.reload).to be_paid
      expect(invoice.razorpay_payment_id).to eq(payment_id)
    end

    it "rejects an invalid signature" do
      allow(client_double).to receive(:verify_payment_link_signature).and_return(false)

      expect(described_class.process(invoice:, params: callback_params)).to be(false)
      expect(Payment.count).to eq(0)
      expect(invoice.reload).not_to be_paid
    end
  end
end
