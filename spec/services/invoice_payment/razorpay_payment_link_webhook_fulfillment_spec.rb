# frozen_string_literal: true

require "openssl"
require "rails_helper"

RSpec.describe InvoicePayment::RazorpayPaymentLinkWebhookFulfillment do
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
        webhook_secret: "webhook_secret",
        enabled_on_invoices: true
      }
    )
  end
  let(:payload) do
    {
      event: "payment_link.paid",
      created_at: Time.zone.local(2026, 4, 29, 12, 0, 0).to_i,
      payload: {
        payment_link: {
          entity: {
            id: "plink_test_123",
            amount_paid: 100_000,
            updated_at: Time.zone.local(2026, 4, 29, 12, 0, 0).to_i,
            reference_id: "miru-inv-#{invoice.id}",
            notes: {
              miru_invoice_id: invoice.id.to_s,
              company_id: company.id.to_s
            },
            customer: {
              name: "Acme"
            }
          }
        },
        payment: {
          entity: {
            id: "pay_test_123"
          }
        }
      }
    }.to_json
  end
  let(:signature) { sign(payload) }

  before do
    allow(PaymentMailer).to receive_message_chain(:with, :payment, :deliver_later)
    allow_any_instance_of(Invoice).to receive(:send_to_client_email)
  end

  it "settles the invoice when the Razorpay webhook signature is valid" do
    result = nil

    expect {
      result = described_class.new(payload:, signature:).process
    }.to have_enqueued_job(RazorpayPayoutJob)

    expect(result).to be(true)
    expect(invoice.reload).to be_paid
    expect(invoice.razorpay_payment_id).to eq("pay_test_123")
    expect(Payment.last.transaction_type).to eq("razorpay")
  end

  it "uses the payment entity amount instead of the cumulative payment link amount" do
    partial_payload = JSON.parse(payload)
    partial_payload["event"] = "payment_link.partially_paid"
    partial_payload["payload"]["payment_link"]["entity"]["amount_paid"] = 100_000
    partial_payload["payload"]["payment"]["entity"]["amount"] = 50_000
    partial_payload = partial_payload.to_json

    result = described_class.new(payload: partial_payload, signature: sign(partial_payload)).process

    expect(result).to be(true)
    expect(invoice.reload.amount_paid).to eq(500)
    expect(invoice).not_to be_paid
    expect(Payment.last.amount).to eq(500)
  end

  it "does not settle the same Razorpay payment twice" do
    partial_payload = JSON.parse(payload)
    partial_payload["event"] = "payment_link.partially_paid"
    partial_payload["payload"]["payment"]["entity"]["amount"] = 50_000
    partial_payload = partial_payload.to_json
    partial_signature = sign(partial_payload)

    2.times do
      expect(described_class.new(payload: partial_payload, signature: partial_signature).process).to be(true)
    end

    expect(invoice.reload.amount_paid).to eq(500)
    expect(Payment.count).to eq(1)
  end

  it "finds the invoice by reference id when notes are missing" do
    reference_payload = JSON.parse(payload)
    reference_payload["payload"]["payment_link"]["entity"].delete("notes")
    reference_payload = reference_payload.to_json

    result = described_class.new(payload: reference_payload, signature: sign(reference_payload)).process

    expect(result).to be(true)
    expect(invoice.reload).to be_paid
    expect(invoice.razorpay_payment_link_status).to eq("paid")
  end

  it "rejects paid events without a matching invoice" do
    missing_invoice_payload = JSON.parse(payload)
    missing_invoice_payload["payload"]["payment_link"]["entity"]["notes"]["miru_invoice_id"] = "99999999"
    missing_invoice_payload["payload"]["payment_link"]["entity"]["reference_id"] = "miru-inv-99999999"
    missing_invoice_payload = missing_invoice_payload.to_json

    fulfillment = described_class.new(payload: missing_invoice_payload, signature: sign(missing_invoice_payload))

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invoice not found")
    expect(invoice.reload).not_to be_paid
    expect(Payment.count).to eq(0)
  end

  it "rejects paid events when the invoice has no enabled Razorpay provider" do
    provider.update!(enabled: false)

    fulfillment = described_class.new(payload:, signature:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Razorpay webhook secret is not configured")
    expect(invoice.reload).not_to be_paid
    expect(Payment.count).to eq(0)
  end

  it "clears a cancelled payment link so a fresh link can be created later" do
    cancelled_payload = JSON.parse(payload)
    cancelled_payload["event"] = "payment_link.cancelled"
    cancelled_payload["payload"].delete("payment")
    cancelled_payload["payload"]["payment_link"]["entity"]["status"] = "cancelled"
    cancelled_payload["payload"]["payment_link"]["entity"]["cancelled_at"] = Time.zone.local(2026, 4, 29, 12, 10, 0).to_i
    cancelled_payload = cancelled_payload.to_json

    result = described_class.new(payload: cancelled_payload, signature: sign(cancelled_payload)).process

    expect(result).to be(true)
    expect(invoice.reload.razorpay_payment_link_id).to be_nil
    expect(invoice.razorpay_payment_link_url).to be_nil
    expect(invoice.razorpay_payment_link_status).to eq("cancelled")
    expect(Payment.count).to eq(0)
  end

  it "ignores inactive webhook deliveries for superseded payment links" do
    expired_payload = JSON.parse(payload)
    expired_payload["event"] = "payment_link.expired"
    expired_payload["payload"].delete("payment")
    expired_payload["payload"]["payment_link"]["entity"]["id"] = "plink_old"
    expired_payload["payload"]["payment_link"]["entity"]["status"] = "expired"
    expired_payload = expired_payload.to_json

    result = described_class.new(payload: expired_payload, signature: sign(expired_payload)).process

    expect(result).to be(true)
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_test_123")
    expect(invoice.razorpay_payment_link_url).to eq("https://rzp.io/rzp/test")
    expect(invoice.razorpay_payment_link_status).to be_nil
  end

  it "rejects invalid signatures without mutating invoice payments" do
    fulfillment = described_class.new(payload:, signature: "bad")

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid Razorpay webhook signature")
    expect(fulfillment.error_code).to eq(:invalid_signature)
    expect(invoice.reload).not_to be_paid
    expect(Payment.count).to eq(0)
  end

  it "rejects malformed payloads" do
    fulfillment = described_class.new(payload: "{bad-json", signature: "bad")

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid Razorpay webhook payload")
    expect(Payment.count).to eq(0)
  end

  it "rejects configured providers without a webhook secret" do
    provider.update!(settings: provider.settings.except("webhook_secret_ciphertext", "webhook_secret"))

    fulfillment = described_class.new(payload:, signature:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Razorpay webhook secret is not configured")
    expect(Payment.count).to eq(0)
  end

  def sign(body)
    OpenSSL::HMAC.hexdigest("SHA256", "webhook_secret", body)
  end
end
