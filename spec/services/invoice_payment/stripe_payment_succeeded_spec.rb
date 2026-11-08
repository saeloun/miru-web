# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::StripePaymentSucceeded do
  let(:company) { create(:company, base_currency: "USD") }
  let(:client) { create(:client, company:, currency: "USD") }
  let(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      currency: "USD",
      status: "sent",
      amount: 100,
      amount_due: 100,
      amount_paid: 0,
      payment_infos: { "stripe_payment_intent" => "pi_test_123" }
    )
  end
  let(:amount_received) { 10_000 }
  let(:event) do
    OpenStruct.new(
      id: "evt_test_123",
      created: Time.current.to_i,
      data: OpenStruct.new(
        object: OpenStruct.new(
          id: "pi_test_123",
          amount_received:,
          amount: 10_000,
          currency: "usd"
        )
      )
    )
  end

  before do
    invoice
    allow(PaymentMailer).to receive_message_chain(:with, :payment, :deliver_later)
    allow_any_instance_of(Invoice).to receive(:send_to_client_email)
  end

  it "stores the Stripe payment intent ID when settling the invoice" do
    payment = described_class.process(event)

    expect(payment.provider_event_id).to eq("stripe:#{event.data.object.id}")
    expect(invoice.reload).to be_paid
  end

  it "preserves replay protection for an existing event-based payment reference" do
    create(:payment, invoice:, amount: 50, transaction_type: :stripe, provider_event_id: event.id)

    expect { described_class.process(event) }.not_to change(Payment, :count)
  end

  it "rejects events without a payment intent ID before looking up an invoice" do
    event.data.object.id = nil
    expect(Invoice).not_to receive(:where)

    expect(described_class.process(event)).to be(false)
  end

  context "when Stripe replays a partial payment event" do
    let(:amount_received) { 5_000 }

    it "settles the event only once" do
      results = []

      expect do
        2.times { results << described_class.process(event) }
      end.to change(Payment, :count).by(1)

      expect(results.last).to be(true)
      expect(invoice.reload.amount_paid).to eq(50)
    end
  end

  it "records reconciliation when the invoice was paid while acquiring the lock" do
    allow(Invoice).to receive_message_chain(:where, :first).and_return(invoice)
    expect(invoice).to receive(:with_lock) do |&block|
      invoice.update_columns(status: Invoice.statuses.fetch("paid"), amount_due: 0)
      invoice.reload
      block.call
    end

    expect do
      payment = described_class.process(event)
      expect(payment.note).to eq("Stripe_Payment_Already_Paid_Reconciliation")
    end.to change(Payment, :count).by(1)
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0, amount_paid: 0)
  end
end
