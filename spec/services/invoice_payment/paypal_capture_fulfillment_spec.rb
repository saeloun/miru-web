# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::PaypalCaptureFulfillment do
  let(:company) { create(:company) }
  let(:client_record) { create(:client, company:, currency: "USD", name: "Acme", email: "client@example.com") }
  let(:invoice) do
    create(:invoice, company:, client: client_record, currency: "USD", amount: 100, amount_due: 100, amount_paid: 0, status: "sent", payment_infos: { "paypal_order_id" => "ORDER-1" })
  end
  let!(:provider) do
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
  let(:completed_order) do
    {
      "id" => "ORDER-1",
      "status" => "COMPLETED",
      "payer" => { "name" => { "given_name" => "Jane", "surname" => "Buyer" }, "email_address" => "jane@example.com" },
      "purchase_units" => [{
        "custom_id" => invoice.id.to_s,
        "payments" => { "captures" => [{ "id" => "CAP-1", "status" => "COMPLETED", "amount" => { "currency_code" => "USD", "value" => "100.00" }, "create_time" => "2026-09-12T10:00:00Z" }] }
      }]
    }
  end
  let(:fulfillment) { described_class.new(invoice:, order_id: "ORDER-1") }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "captures the order and settles the invoice" do
    expect(client).to receive(:capture_order).with("ORDER-1", request_id: "capture-#{invoice.id}-ORDER-1").and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    payment = Payment.last
    expect(payment).to have_attributes(transaction_type: "paypal", amount: 100, status: "paid", provider_event_id: "paypal:CAP-1", name: "Jane Buyer", transaction_date: Date.new(2026, 9, 12))
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0)
    expect(invoice.paypal_capture_id).to eq("CAP-1")
    expect(invoice.paypal_order_status).to eq("COMPLETED")
  end

  it "sends payment emails on settlement" do
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { fulfillment.process }.to have_enqueued_job(ActionMailer::MailDeliveryJob).at_least(:once)
  end

  it "reads the order when PayPal reports it already captured" do
    allow(client).to receive(:capture_order).and_raise(PaymentProviders::PaypalClient::Error.new("captured", issue: "ORDER_ALREADY_CAPTURED"))
    expect(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)

    expect(fulfillment.process).to be(true)
    expect(invoice.reload.status).to eq("paid")
  end

  it "does not settle twice for the same capture" do
    allow(client).to receive(:capture_order).and_return(completed_order)
    fulfillment.process
    invoice.update_columns(status: "sent", amount_due: 100, amount_paid: 0)

    expect { described_class.new(invoice:, order_id: "ORDER-1").process }.not_to change(Payment, :count)
  end

  it "returns true without calling PayPal when the invoice is already paid" do
    invoice.update!(status: "paid", amount_due: 0, amount_paid: 100)
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(true)
  end

  it "rejects captures for another invoice" do
    completed_order["purchase_units"][0]["custom_id"] = "999"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order does not belong to this invoice")
    expect(invoice.reload.status).to eq("sent")
  end

  it "rejects captures in a different currency" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"] = "EUR"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal capture currency does not match the invoice")
  end

  it "fails when the capture is not completed" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["status"] = "PENDING"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal payment is not completed")
  end

  it "fails with the PayPal message on API errors" do
    allow(client).to receive(:capture_order).and_raise(PaymentProviders::PaypalClient::Error.new("Instrument declined", issue: "INSTRUMENT_DECLINED"))

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Instrument declined")
  end

  it "fails when the order id is blank" do
    expect(described_class.new(invoice:, order_id: "").process).to be(false)
  end

  it "fails when PayPal is not configured for the workspace" do
    provider.destroy!

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal is not configured for this workspace")
  end
end
