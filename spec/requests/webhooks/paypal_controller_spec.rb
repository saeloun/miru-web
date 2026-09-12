# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PayPal webhooks", type: :request do
  let(:headers) do
    {
      "CONTENT_TYPE" => "application/json",
      "PAYPAL-TRANSMISSION-ID" => "tid",
      "PAYPAL-TRANSMISSION-SIG" => "sig",
      "PAYPAL-TRANSMISSION-TIME" => "2026-09-12T10:00:00Z",
      "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/cert",
      "PAYPAL-AUTH-ALGO" => "SHA256withRSA"
    }
  end
  let(:payload) { { id: "WH-EVT-1", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { custom_id: "1" } }.to_json }

  it "rejects oversized bodies" do
    post "/webhooks/paypal/events", params: "x" * (Webhooks::PaypalController::MAX_WEBHOOK_BODY_BYTES + 1), headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:content_too_large)
  end

  it "passes the raw body and PayPal headers to the fulfillment service" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: true, error: nil, error_code: nil)
    expect(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).with(
      payload:,
      headers: hash_including("PAYPAL-TRANSMISSION-ID" => "tid", "PAYPAL-TRANSMISSION-SIG" => "sig", "PAYPAL-AUTH-ALGO" => "SHA256withRSA")
    ).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers: headers

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("status" => "ok")
  end

  it "answers 401 for invalid signatures" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: false, error: "Invalid PayPal webhook signature", error_code: :invalid_signature)
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers: headers

    expect(response).to have_http_status(:unauthorized)
  end

  it "answers 422 for other failures" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: false, error: "Invoice not found", error_code: nil)
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers: headers

    expect(response).to have_http_status(:unprocessable_content)
    expect(JSON.parse(response.body)["error"]).to eq("Invoice not found")
  end

  it "answers 500 and reports unexpected errors" do
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_raise(StandardError, "boom")

    post "/webhooks/paypal/events", params: payload, headers: headers

    expect(response).to have_http_status(:internal_server_error)
  end
end
