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
        "reference_id" => PaymentProviders::PaypalOrderService.reference_id(invoice),
        "custom_id" => invoice.id.to_s,
        "payments" => { "captures" => [{ "id" => "CAP-1", "status" => "COMPLETED", "amount" => { "currency_code" => "USD", "value" => "100.00" }, "create_time" => "2026-09-12T10:00:00Z" }] }
      }]
    }
  end
  let(:approved_order) do
    {
      "id" => "ORDER-1",
      "status" => "APPROVED",
      "purchase_units" => [{
        "reference_id" => PaymentProviders::PaypalOrderService.reference_id(invoice),
        "custom_id" => invoice.id.to_s,
        "amount" => { "currency_code" => "USD", "value" => "100.00" }
      }]
    }
  end
  let(:fulfillment) { described_class.new(invoice:, order_id: "ORDER-1") }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
    allow(client).to receive(:show_order).with("ORDER-1").and_return(approved_order)
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

  it "holds the invoice lock while validating and capturing the order" do
    locked = false
    allow(invoice).to receive(:with_lock) do |&block|
      locked = true
      block.call
    ensure
      locked = false
    end
    allow(client).to receive(:show_order) do
      expect(locked).to be(true)
      approved_order
    end
    allow(client).to receive(:capture_order) do
      expect(locked).to be(true)
      completed_order
    end

    expect(fulfillment.process).to be(true)
  end

  it "sends payment emails on settlement" do
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { fulfillment.process }.to have_enqueued_job(ActionMailer::MailDeliveryJob).at_least(:once)
  end

  it "reads the order when PayPal reports it already captured" do
    allow(client).to receive(:capture_order).and_raise(PaymentProviders::PaypalClient::Error.new("captured", issue: "ORDER_ALREADY_CAPTURED"))
    allow(client).to receive(:show_order).with("ORDER-1").and_return(approved_order, completed_order)

    expect(fulfillment.process).to be(true)
    expect(invoice.reload.status).to eq("paid")
  end

  it "does not settle twice for the same capture" do
    allow(client).to receive(:capture_order).and_return(completed_order)
    fulfillment.process
    invoice.update_columns(status: "sent", amount_due: 100, amount_paid: 0)

    expect { described_class.new(invoice:, order_id: "ORDER-1").process }.not_to change(Payment, :count)
  end

  it "does not capture an approved order when the invoice is already paid" do
    invoice.update!(status: "paid", amount_due: 0, amount_paid: 100)
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(true)
  end

  it "records a completed capture for reconciliation when the invoice is already paid" do
    invoice.update!(status: "paid", amount_due: 0, amount_paid: 100)
    allow(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)
    expect(client).not_to receive(:capture_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(Payment.last).to have_attributes(
      provider_event_id: "paypal:CAP-1",
      status: "partially_paid",
      note: "PayPal_Payment_Already_Paid_Reconciliation"
    )
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0, amount_paid: 100)
    expect(fulfillment).not_to be_settled
  end

  it "does not capture after the invoice is waived" do
    invoice.update!(status: "waived")
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invoice is no longer payable")
  end

  it "does not capture an order for a stale balance" do
    invoice.update!(amount_paid: 40, amount_due: 60)
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order amount no longer matches the invoice")
  end

  it "does not capture an order for a stale currency" do
    approved_order["purchase_units"][0]["amount"]["currency_code"] = "EUR"
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order amount no longer matches the invoice")
  end

  it "records a completed capture after the invoice becomes unpayable" do
    invoice.update!(status: "waived")
    allow(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)
    expect(client).not_to receive(:capture_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(invoice.reload.status).to eq("paid")
  end

  it "records a completed capture after the invoice currency changes" do
    original_due = invoice.amount_due
    invoice.update_columns(currency: "EUR")
    allow(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)
    expect(client).not_to receive(:capture_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(Payment.last).to have_attributes(payment_currency: "USD", status: "partially_paid")
    expect(invoice.reload.amount_due).to eq(original_due)
  end

  it "recognizes a completed order after the invoice public key rotates" do
    invoice.update_columns(external_view_key: SecureRandom.hex)
    allow(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)
    expect(client).not_to receive(:capture_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
  end

  it "never captures an order that belongs to another invoice" do
    approved_order["purchase_units"][0]["reference_id"] = "miru-inv-another-checkout"
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order does not belong to this invoice")
    expect(invoice.reload.status).to eq("sent")
    expect(invoice.paypal_capture_id).to be_nil
  end

  it "does not capture an older order after a replacement was created" do
    invoice.update!(paypal_order_id: "ORDER-2")
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order is no longer active for this invoice")
  end

  it "records captures in a different currency for reconciliation" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"] = "EUR"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(Payment.last).to have_attributes(payment_currency: "EUR", status: "partially_paid", note: "PayPal_Payment_Currency_Reconciliation")
    expect(invoice.reload.amount_due).to eq(100)
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

  it "rejects an order id that could alter the PayPal request path" do
    expect(client).not_to receive(:show_order)

    fulfillment = described_class.new(invoice:, order_id: "../../v1/oauth2/token?x=1")
    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order id is invalid")
  end

  it "fails when PayPal is not configured for the workspace" do
    provider.destroy!

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal is not configured for this workspace")
  end

  it "records capture details when currency reconciliation is required" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"] = "EUR"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { fulfillment.process }
      .to change { invoice.reload.paypal_capture_id }.from(nil).to("CAP-1")
    expect(Payment.last.payment_currency).to eq("EUR")
  end

  it "settles on the stored order id when PayPal omits custom_id" do
    approved_order["purchase_units"][0].delete("custom_id")
    completed_order["purchase_units"][0].delete("custom_id")
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(invoice.reload.status).to eq("paid")
  end

  it "accepts custom_id carried on the capture instead of the purchase unit" do
    approved_order["purchase_units"] = [{
      "reference_id" => PaymentProviders::PaypalOrderService.reference_id(invoice),
      "amount" => { "currency_code" => "USD", "value" => "100.00" },
      "payments" => { "captures" => [{ "custom_id" => invoice.id.to_s }] }
    }]
    completed_order["purchase_units"][0].delete("custom_id")
    completed_order["purchase_units"][0]["payments"]["captures"][0]["custom_id"] = invoice.id.to_s
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
  end

  it "records a part payment instead of discarding a smaller capture" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"] = "40.00"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(Payment.last.status).to eq("partially_paid")
    expect(invoice.reload.status).not_to eq("paid")
  end

  it "fails without raising when PayPal returns an unreadable capture amount" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"] = ""
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal returned an unexpected capture response")
  end

  it "fails without raising when the payment cannot be saved" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"] = "0.00"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to include("Amount")
  end

  it "rejects a completed capture without an id" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["id"] = ""
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(false) }.not_to change(Payment, :count)
    expect(fulfillment.error).to eq("PayPal capture id is missing")
  end

  it "settles a zero-decimal currency without scaling the amount" do
    invoice.update!(currency: "JPY", amount: 250, amount_due: 250)
    approved_order["purchase_units"][0]["amount"] = { "currency_code" => "JPY", "value" => "250" }
    capture = completed_order["purchase_units"][0]["payments"]["captures"][0]
    capture["amount"] = { "currency_code" => "JPY", "value" => "250" }
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    expect(Payment.last.amount).to eq(250)
    expect(invoice.reload.status).to eq("paid")
  end
end
