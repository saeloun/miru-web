# frozen_string_literal: true

require "openssl"
require "rails_helper"

RSpec.describe "Razorpay webhooks", type: :request do
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

  it "settles a paid Razorpay payment link webhook" do
    post "/webhooks/razorpay/payment_links", params: payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => signature
    }

    expect(response).to have_http_status(:ok)
    expect(invoice.reload).to be_paid
    expect(invoice.razorpay_payment_id).to eq("pay_test_123")
    expect(Payment.last.transaction_type).to eq("razorpay")
  end

  it "does not settle a replayed partial payment delivery twice" do
    partial_payload = JSON.parse(payload)
    partial_payload["event"] = "payment_link.partially_paid"
    partial_payload["payload"]["payment_link"]["entity"]["amount_paid"] = 50_000
    partial_payload["payload"]["payment"]["entity"]["amount"] = 50_000
    partial_payload = partial_payload.to_json
    partial_signature = sign(partial_payload)

    2.times do
      post "/webhooks/razorpay/payment_links", params: partial_payload, headers: {
        "CONTENT_TYPE" => "application/json",
        "HTTP_X_RAZORPAY_SIGNATURE" => partial_signature
      }

      expect(response).to have_http_status(:ok)
    end

    expect(invoice.reload.amount_paid).to eq(500)
    expect(Payment.count).to eq(1)
  end

  it "rejects an invalid signature" do
    post "/webhooks/razorpay/payment_links", params: payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => "bad"
    }

    expect(response).to have_http_status(:unauthorized)
    expect(invoice.reload).not_to be_paid
    expect(Payment.count).to eq(0)
  end

  it "rejects malformed payloads" do
    post "/webhooks/razorpay/payment_links", params: "{bad-json", headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => "bad"
    }

    expect(response).to have_http_status(:unprocessable_content)
    expect(JSON.parse(response.body)["error"]).to eq("Invalid Razorpay webhook payload")
    expect(Payment.count).to eq(0)
  end

  it "returns a controlled server error when processing raises unexpectedly" do
    allow_any_instance_of(InvoicePayment::RazorpayPaymentLinkWebhookFulfillment)
      .to receive(:process)
      .and_raise(StandardError, "boom")
    allow(Rails.logger).to receive(:error)
    allow(Sentry).to receive(:capture_exception) if defined?(Sentry)

    post "/webhooks/razorpay/payment_links", params: payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => signature
    }

    expect(response).to have_http_status(:internal_server_error)
    expect(JSON.parse(response.body)["error"]).to eq("Unable to process Razorpay webhook")
    expect(Sentry).to have_received(:capture_exception).with(instance_of(StandardError), hash_including(:extra)) if defined?(Sentry)
    expect(Rails.logger).to have_received(:error).with(include("[Razorpay webhook] razorpay_payment_links failed"))
  end

  it "handles payout webhook deliveries" do
    payout_payload = { event: "payout.processed", payload: { payout: { entity: { id: "pout_test_123" } } } }.to_json
    payout_signature = sign(payout_payload)
    fulfillment = instance_double(PaymentProviders::RazorpayPayoutWebhookFulfillment, process: true)
    allow(PaymentProviders::RazorpayPayoutWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/razorpay/payouts", params: payout_payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => payout_signature
    }

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["status"]).to eq("ok")
    expect(PaymentProviders::RazorpayPayoutWebhookFulfillment).to have_received(:new).with(
      payload: payout_payload,
      signature: payout_signature
    )
  end

  it "returns unauthorized for invalid payout webhook signatures" do
    payout_payload = { event: "payout.failed", payload: { payout: { entity: { id: "pout_test_123" } } } }.to_json
    fulfillment = instance_double(
      PaymentProviders::RazorpayPayoutWebhookFulfillment,
      process: false,
      error: "Invalid Razorpay webhook signature",
      error_code: :invalid_signature
    )
    allow(PaymentProviders::RazorpayPayoutWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/razorpay/payouts", params: payout_payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => "bad"
    }

    expect(response).to have_http_status(:unauthorized)
    expect(JSON.parse(response.body)["error"]).to eq("Invalid Razorpay webhook signature")
  end

  it "logs payout webhook exceptions with the payout webhook tag" do
    payout_payload = { event: "payout.processed" }.to_json
    allow(PaymentProviders::RazorpayPayoutWebhookFulfillment).to receive(:new).and_raise(StandardError, "boom")
    allow(Rails.logger).to receive(:error)
    allow(Sentry).to receive(:capture_exception) if defined?(Sentry)

    post "/webhooks/razorpay/payouts", params: payout_payload, headers: {
      "CONTENT_TYPE" => "application/json",
      "HTTP_X_RAZORPAY_SIGNATURE" => sign(payout_payload)
    }

    expect(response).to have_http_status(:internal_server_error)
    expect(JSON.parse(response.body)["error"]).to eq("Unable to process Razorpay webhook")
    if defined?(Sentry)
      expect(Sentry).to have_received(:capture_exception).with(
        instance_of(StandardError),
        hash_including(extra: hash_including(webhook: "razorpay_payouts"))
      )
    end
    expect(Rails.logger).to have_received(:error).with(include("[Razorpay webhook] razorpay_payouts failed"))
  end

  def sign(body)
    OpenSSL::HMAC.hexdigest("SHA256", "webhook_secret", body)
  end
end
