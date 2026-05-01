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
      expect(invoice.razorpay_payment_link_status).to eq("created")
    end

    it "asks Razorpay to send SMS when requested" do
      client.update!(phone: "+919876543210")
      expect(client_double).to receive(:create_payment_link) do |payload|
        expect(payload.dig(:notify, :sms)).to be(true)
        expect(payload.dig(:customer, :contact)).to eq("+919876543210")

        { "id" => "plink_test_123", "short_url" => "https://rzp.io/rzp/test" }
      end

      service = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success",
        notify_sms: true
      )

      expect(service.process).to eq("https://rzp.io/rzp/test")
      expect(service.sms_sent?).to be(true)
    end

    it "reuses an active existing payment link and refreshes the stored status" do
      invoice.update!(
        razorpay_payment_link_id: "plink_test_123",
        razorpay_payment_link_url: "https://rzp.io/rzp/test",
        razorpay_payment_link_status: "created"
      )
      expect(client_double).to receive(:fetch_payment_link)
        .with("plink_test_123")
        .and_return({ "id" => "plink_test_123", "status" => "partially_paid" })
      expect(client_double).not_to receive(:create_payment_link)

      payment_url = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success"
      ).process

      expect(payment_url).to eq("https://rzp.io/rzp/test")
      expect(invoice.reload.razorpay_payment_link_status).to eq("partially_paid")
    end

    it "resends an active existing payment link by SMS when requested" do
      invoice.update!(
        razorpay_payment_link_id: "plink_test_123",
        razorpay_payment_link_url: "https://rzp.io/rzp/test",
        razorpay_payment_link_status: "created"
      )
      expect(client_double).to receive(:fetch_payment_link)
        .with("plink_test_123")
        .and_return({ "id" => "plink_test_123", "status" => "created" })
      expect(client_double).to receive(:notify_payment_link).with("plink_test_123", "sms").and_return({ "success" => true })
      expect(client_double).not_to receive(:create_payment_link)

      service = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success",
        notify_sms: true
      )

      expect(service.process).to eq("https://rzp.io/rzp/test")
      expect(service.sms_sent?).to be(true)
    end

    it "recreates an inactive existing payment link" do
      invoice.update!(
        razorpay_payment_link_id: "plink_old",
        razorpay_payment_link_url: "https://rzp.io/rzp/old",
        razorpay_payment_link_status: "created"
      )
      expect(client_double).to receive(:fetch_payment_link)
        .with("plink_old")
        .and_return({ "id" => "plink_old", "status" => "expired" })
      expect(client_double).to receive(:create_payment_link)
        .and_return({ "id" => "plink_new", "short_url" => "https://rzp.io/rzp/new", "status" => "created" })

      payment_url = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success"
      ).process

      expect(payment_url).to eq("https://rzp.io/rzp/new")
      expect(invoice.reload.razorpay_payment_link_id).to eq("plink_new")
      expect(invoice.razorpay_payment_link_url).to eq("https://rzp.io/rzp/new")
      expect(invoice.razorpay_payment_link_status).to eq("created")
    end

    it "keeps the stored link when Razorpay fetch fails" do
      invoice.update!(
        razorpay_payment_link_id: "plink_test_123",
        razorpay_payment_link_url: "https://rzp.io/rzp/test",
        razorpay_payment_link_status: "created"
      )
      expect(client_double).to receive(:fetch_payment_link)
        .with("plink_test_123")
        .and_raise(PaymentProviders::RazorpayClient::Error, "Razorpay unavailable")
      expect(client_double).not_to receive(:create_payment_link)

      payment_url = described_class.new(
        invoice:,
        provider:,
        callback_url: "https://app.test/invoices/#{invoice.id}/payments/razorpay_success"
      ).process

      expect(payment_url).to eq("https://rzp.io/rzp/test")
      expect(invoice.reload.razorpay_payment_link_id).to eq("plink_test_123")
    end
  end
end
