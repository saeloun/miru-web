# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalOrderService do
  let(:company) { create(:company, name: "Acme Studio") }
  let(:client_record) { create(:client, company:, currency: "USD") }
  let(:invoice) do
    create(:invoice, company:, client: client_record, currency: "USD", amount: 250, amount_due: 250, amount_paid: 0, status: "sent", invoice_number: "INV-42")
  end
  let(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      connected: true,
      settings: { client_id: "client-id", environment: "sandbox" }
    ).tap { |record| record.client_secret = "secret"; record.save! }
  end
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:service) do
    described_class.new(
      invoice:,
      provider:,
      return_url: "https://app.miru.so/invoices/key/payments/paypal_return",
      cancel_url: "https://app.miru.so/invoices/key/payments/cancel"
    )
  end

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "creates a capture order for the amount due and stores the order on the invoice" do
    expect(client).to receive(:create_order).with(
      hash_including(
        intent: "CAPTURE",
        purchase_units: [hash_including(
          reference_id: "miru-inv-#{invoice.id}",
          custom_id: invoice.id.to_s,
          description: "Invoice INV-42 from Acme Studio",
          amount: { currency_code: "USD", value: "250.00" }
        )],
        payment_source: { paypal: { experience_context: hash_including(
          brand_name: "Acme Studio",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          return_url: "https://app.miru.so/invoices/key/payments/paypal_return",
          cancel_url: "https://app.miru.so/invoices/key/payments/cancel"
        ) } }
      ),
      request_id: kind_of(String)
    ).and_return(
      "id" => "ORDER-1",
      "status" => "PAYER_ACTION_REQUIRED",
      "links" => [{ "rel" => "self", "href" => "https://api.sandbox.paypal.com/v2/checkout/orders/ORDER-1" }, { "rel" => "payer-action", "href" => "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1" }]
    )

    expect(service.process).to eq("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1")
    expect(invoice.reload.paypal_order_id).to eq("ORDER-1")
    expect(invoice.paypal_order_status).to eq("PAYER_ACTION_REQUIRED")
  end

  it "accepts the legacy approve link" do
    allow(client).to receive(:create_order).and_return("id" => "ORDER-2", "status" => "CREATED", "links" => [{ "rel" => "approve", "href" => "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-2" }])

    expect(service.process).to eq("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-2")
  end

  it "raises when PayPal returns no approval link" do
    allow(client).to receive(:create_order).and_return("id" => "ORDER-3", "links" => [])

    expect { service.process }.to raise_error(PaymentProviders::PaypalClient::Error, "PayPal did not return an approval link")
  end
end
