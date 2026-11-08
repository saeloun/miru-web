# frozen_string_literal: true

require "rails_helper"
require "hash_dot"

RSpec.describe InvoicePayment::StripeCheckoutFulfillment do
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }

  def event_for(invoice:, payment_intent:)
    {
      id: "evt_checkout",
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

  context "when the payment does not settle the invoice" do
    let(:invoice) do
      create(:invoice, company:, client:, currency: "INR", status: "sent", amount: 123.45,
        amount_due: 123.45, amount_paid: 0, payment_infos: { "stripe_payment_intent" => "pi_partial" })
    end
    let(:checkout_event) do
      event_for(invoice:, payment_intent: "pi_partial").tap { |event| event.data.object.amount_total = 2345 }
    end
    let(:intent_event) do
      { id: "evt_intent", created: Time.current.to_i,
        data: { object: { id: "pi_partial", amount_received: 2345, currency: "inr" } } }.to_dot
    end

    before { invoice }

    it "records a repeated checkout payment once" do
      expect do
        2.times { described_class.process(checkout_event) }
      end.to change { invoice.payments.count }.by(1)

      expect(invoice.reload).to have_attributes(amount_paid: BigDecimal("23.45"), amount_due: 100)
    end

    it "ignores the payment-intent event after the checkout event" do
      expect { described_class.process(checkout_event) }.to change(Payment, :count).by(1)

      expect { InvoicePayment::StripePaymentSucceeded.process(intent_event) }.not_to change(Payment, :count)
      expect(invoice.reload).to have_attributes(amount_paid: BigDecimal("23.45"), amount_due: 100)
    end

    it "ignores the checkout event after the payment-intent event" do
      expect { InvoicePayment::StripePaymentSucceeded.process(intent_event) }.to change(Payment, :count).by(1)

      expect { described_class.process(checkout_event) }.not_to change(Payment, :count)
      expect(invoice.reload).to have_attributes(amount_paid: BigDecimal("23.45"), amount_due: 100)
    end
  end

  it "rejects checkout fulfillment when neither side has a payment intent" do
    invoice = create(:invoice, company:, client:, currency: "INR", status: "sent", amount: 100,
      amount_due: 100, amount_paid: 0)

    expect do
      expect(described_class.process(event_for(invoice:, payment_intent: nil))).to be(false)
    end.not_to change(Payment, :count)
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

  it "preserves the captured currency when recording a late checkout for reconciliation" do
    invoice = create(:invoice, company:, client:, currency: "INR", status: "paid", amount: 100,
      amount_due: 0, amount_paid: 100, payment_infos: { "stripe_payment_intent" => "pi_currency_late" })
    event = event_for(invoice:, payment_intent: "pi_currency_late")
    event.data.object.currency = "usd"
    allow(CurrencyConversionService).to receive(:get_exchange_rate).with("USD", company.base_currency, Date.current)
      .and_return(83)

    payment = described_class.process(event)

    expect(payment).to have_attributes(payment_currency: "USD", amount: 100, base_currency_amount: 8300,
      note: "Stripe_Payment_Already_Paid_Reconciliation")
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0, amount_paid: 100)
  end
end
