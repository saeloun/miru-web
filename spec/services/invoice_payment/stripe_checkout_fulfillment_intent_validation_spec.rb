# frozen_string_literal: true

require "rails_helper"
require "hash_dot"

RSpec.describe InvoicePayment::StripeCheckoutFulfillment do
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }

  def event_for(invoice:, payment_intent:)
    {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent:,
          amount_total: Money.from_amount(invoice.amount, "inr").cents,
          status: "complete",
          payment_status: "paid",
          currency: "inr"
        }
      },
      created: Time.current.strftime("%s")
    }.to_dot
  end

  it "rejects checkout fulfillment when only the invoice has a payment intent" do
    invoice = create(
      :invoice,
      status: "sent",
      company:,
      client:,
      amount: 11583.33,
      amount_due: 11583.33,
      amount_paid: 0,
      payment_infos: { "stripe_payment_intent" => "pi_invoice_only" }
    )

    expect(described_class.new(event_for(invoice:, payment_intent: nil)).process).to be(false)
    expect(Payment.last&.invoice_id).not_to eq(invoice.id)
  end

  it "rejects checkout fulfillment when only the stripe event has a payment intent" do
    invoice = create(
      :invoice,
      status: "sent",
      company:,
      client:,
      amount: 11583.33,
      amount_due: 11583.33,
      amount_paid: 0
    )

    expect(described_class.new(event_for(invoice:, payment_intent: "pi_event_only")).process).to be(false)
    expect(Payment.last&.invoice_id).not_to eq(invoice.id)
  end

  it "settles the remaining balance once when the Stripe checkout webhook is replayed" do
    invoice = create(:invoice, company:, client:, currency: "INR", status: "sent", amount: 123.45,
      amount_due: 23.45, amount_paid: 100, payment_infos: { "stripe_payment_intent" => "pi_remaining" })
    event = event_for(invoice:, payment_intent: "pi_remaining")
    event.data.object.amount_total = 2345

    expect { described_class.new(event).process }.to change { invoice.payments.count }.by(1)
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0, amount_paid: BigDecimal("123.45"))
    expect(invoice.payments.last.amount).to eq(BigDecimal("23.45"))
    expect { described_class.new(event).process }.not_to change { invoice.payments.count }
  end
end
