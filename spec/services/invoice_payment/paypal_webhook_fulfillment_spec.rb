# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::PaypalWebhookFulfillment do
  let(:company) { create(:company) }
  let(:client_record) { create(:client, company:, currency: "USD") }
  let(:invoice) { create(:invoice, company:, client: client_record, currency: "USD", amount: 100, amount_due: 100, amount_paid: 0, status: "sent", payment_infos: { "paypal_order_id" => "ORDER-1" }) }
  let!(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      connected: true,
      settings: { client_id: "client-id", environment: "sandbox", webhook_id: "WH-1" }
    ).tap { |record| record.client_secret = "secret"; record.save! }
  end
  let(:headers) { { "PAYPAL-TRANSMISSION-ID" => "tid", "PAYPAL-TRANSMISSION-SIG" => "sig", "PAYPAL-TRANSMISSION-TIME" => "t", "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/cert", "PAYPAL-AUTH-ALGO" => "SHA256withRSA" } }
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:capture_fulfillment) { instance_double(InvoicePayment::PaypalCaptureFulfillment, process: true, error: nil) }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
    allow(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).and_return(capture_fulfillment)
  end

  def payload_for(event_type, resource)
    { id: "WH-EVT-1", event_type:, resource: }.to_json
  end

  it "settles PAYMENT.CAPTURE.COMPLETED events after verifying the signature" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", status: "COMPLETED", custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    expect(client).to receive(:verify_webhook_signature).with(headers:, body: payload, webhook_id: "WH-1").and_return(true)
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "captures CHECKOUT.ORDER.APPROVED events" do
    payload = payload_for("CHECKOUT.ORDER.APPROVED", { id: "ORDER-1", status: "APPROVED", purchase_units: [{ custom_id: invoice.id.to_s }] })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "finds the invoice by order id when custom_id is missing" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    invoice
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "ignores unsupported events" do
    fulfillment = described_class.new(payload: payload_for("PAYMENT.CAPTURE.REFUNDED", { id: "CAP-1" }), headers:)

    expect(fulfillment.process).to be(true)
  end

  it "rejects invalid signatures with an error code" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    allow(client).to receive(:verify_webhook_signature).and_return(false)
    fulfillment = described_class.new(payload:, headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error_code).to eq(:invalid_signature)
  end

  it "acknowledges events that belong to another integration on the merchant account" do
    fulfillment = described_class.new(payload: payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: "0", supplementary_data: { related_ids: { order_id: "NOPE" } } }), headers:)

    expect(fulfillment.process).to be(true)
    expect(fulfillment.error).to be_nil
  end

  it "acknowledges events when no webhook is registered for the workspace" do
    provider.update!(settings: provider.settings.except("webhook_id"))
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    expect(InvoicePayment::PaypalCaptureFulfillment).not_to receive(:new)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "asks PayPal to retry when signature verification is unavailable" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    allow(client).to receive(:verify_webhook_signature).and_raise(PaymentProviders::PaypalClient::Error.new("Client Authentication failed"))
    fulfillment = described_class.new(payload:, headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error_code).to eq(:verification_unavailable)
  end

  it "acknowledges payloads whose JSON is not a webhook event instead of raising" do
    expect(InvoicePayment::PaypalCaptureFulfillment).not_to receive(:new)

    ["[]", "null", "123", '{"event_type":"CHECKOUT.ORDER.APPROVED","resource":{"purchase_units":["x"]}}',
     '{"event_type":"PAYMENT.CAPTURE.COMPLETED","resource":{"supplementary_data":"x"}}'].each do |body|
      fulfillment = described_class.new(payload: body, headers:)

      expect(fulfillment.process).to be(true), "expected #{body} to be acknowledged"
    end
  end

  it "acknowledges a permanent capture failure so PayPal stops retrying it" do
    payload = payload_for("CHECKOUT.ORDER.APPROVED", { id: "ORDER-1", purchase_units: [{ custom_id: invoice.id.to_s }] })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    allow(capture_fulfillment).to receive_messages(process: false, error: "Instrument declined", error_code: nil)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "asks PayPal to retry when the capture failed because PayPal was unavailable" do
    payload = payload_for("CHECKOUT.ORDER.APPROVED", { id: "ORDER-1", purchase_units: [{ custom_id: invoice.id.to_s }] })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    allow(capture_fulfillment).to receive_messages(process: false, error: "PayPal request failed", error_code: :provider_unavailable)

    fulfillment = described_class.new(payload:, headers:)
    expect(fulfillment.process).to be(false)
    expect(fulfillment.error_code).to eq(:provider_unavailable)
    expect(fulfillment.error).to eq("PayPal request failed")
  end

  it "fails on malformed JSON" do
    fulfillment = described_class.new(payload: "{", headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid PayPal webhook payload")
  end
end
