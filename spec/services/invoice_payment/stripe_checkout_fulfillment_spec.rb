# frozen_string_literal: true

require "rails_helper"
require "hash_dot"

RSpec.describe InvoicePayment::StripeCheckoutFulfillment do
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(
    :invoice, status: "sent", company:, client:,
    amount: 100, amount_due: 100, amount_paid: 0)
}

  context "when correct stripe event is passed" do
    let!(:intent_id) { Faker::String.random(length: [0, 6]) }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: intent_id,
          amount_total: invoice.amount,
          status: "complete",
          payment_status: "paid"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "creates the payment entry" do
      expect(Payment.last.invoice.id).to eq(invoice.id)
      expect(Payment.last.status).to eq("paid")
    end

    it "updates the invoice status to paid" do
      invoice.reload
      expect(invoice.amount_due).to eq(0)
      expect(invoice.amount_paid).to eq(100)
      expect(invoice.status).to eq("paid")
    end
  end

  context "when intent id of invoice and stripe event doesn't match" do
    let!(:intent_id) { Faker::String.random(length: [0, 6]) }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: "intent_id",
          amount_total: invoice.amount,
          status: "complete",
          payment_status: "paid"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
    end
  end

  context "when stripe event status is not complete" do
    let!(:intent_id) { Faker::String.random(length: [0, 6]) }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: intent_id,
          amount_total: invoice.amount,
          status: "expired",
          payment_status: "paid"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
    end
  end

  context "when stripe event payment_status is not paid" do
    let!(:intent_id) { Faker::String.random(length: [0, 6]) }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: intent_id,
          amount_total: invoice.amount,
          status: "complete",
          payment_status: "unpaid"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
    end
  end
end
