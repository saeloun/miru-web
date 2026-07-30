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

  it "stores the Stripe event ID when settling the invoice" do
    payment = described_class.process(event)

    expect(payment.provider_event_id).to eq(event.id)
    expect(invoice.reload).to be_paid
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

  it "rechecks whether the invoice was paid after acquiring the lock" do
    allow(Invoice).to receive_message_chain(:where, :first).and_return(invoice)
    expect(invoice).to receive(:with_lock) do |&block|
      invoice.update_columns(status: Invoice.statuses.fetch("paid"), amount_due: 0)
      invoice.reload
      block.call
    end

    expect do
      expect(described_class.process(event)).to be(true)
    end.not_to change(Payment, :count)
  end
end
