# frozen_string_literal: true

require "rails_helper"
require "hash_dot"

RSpec.describe InvoicePayment::StripeCheckoutFulfillment, vcr: true do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(
    :invoice, status: "sent", company:, client:,
    amount: 11583.33, amount_due: 11583.33, amount_paid: 0,
    payment_infos: { "stripe_payment_intent" => "pi_3NIU8rENZof8Gnl11WaD1f6t" })
  }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }
  let!(:prepaid_checkout) { "cs_test_a1viKWRgWDqw5wujoW6VpymjPR29sAAXk41JL9p38TJSfUhQDiXwiFZKSV" }

  before do
    stripe_connected_account.update_columns(account_id: "acct_1NIU5SENZof8Gnl1")
    success_checkout = Stripe::Checkout::Session.retrieve(
      prepaid_checkout,
      { stripe_account: stripe_connected_account.reload.account_id })

    success_checkout.metadata.invoice_id = invoice.id
    json_checkout = { data: { object: success_checkout.as_json }, created: 1686646712 }
    object_checkout = JSON.parse(json_checkout.to_json, object_class: OpenStruct)

    @subject = described_class.new(object_checkout).process
  end

  context "when correct stripe event is passed" do
    it "creates the payment entry" do
      expect(Payment.last.invoice.id).to eq(invoice.id)
      expect(Payment.last.status).to eq("paid")
      expect(Payment.last.name).not_to be_nil
    end

    it "updates the invoice status to paid" do
      invoice.reload
      expect(invoice.amount_due).to eq(0)
      expect(invoice.amount_paid).to eq(11583.33)
      expect(invoice.status).to eq("paid")
    end
  end

  context "when intent id of invoice and stripe event doesn't match" do
    let!(:invoice2) { create(
      :invoice, status: "sent", company:, client:,
      amount: 11583.33, amount_due: 11583.33, amount_paid: 0)
    }
    let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice2.id },
          payment_intent: "intent_id",
          amount_total: Money.from_amount(invoice2.amount, "inr").cents,
          status: "complete",
          payment_status: "paid",
          currency: "inr"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
  }

    subject { described_class.new(event).process }

    before do
      invoice2.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice2.id)
    end
  end

  context "when stripe event status is not complete" do
    let!(:invoice3) { create(
      :invoice, status: "sent", company:, client:,
      amount: 11583.33, amount_due: 11583.33, amount_paid: 0)
    }
    let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: intent_id,
          amount_total: invoice.amount,
          status: "expired",
          payment_status: "paid",
          currency: "inr"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice3.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice3.id)
    end
  end

  context "when stripe event payment_status is not paid" do
    let!(:invoice4) { create(
      :invoice, status: "sent", company:, client:,
      amount: 11583.33, amount_due: 11583.33, amount_paid: 0)
    }
    let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
    let!(:current_time) { DateTime.now }
    let!(:event) { {
      data: {
        object: {
          metadata: { invoice_id: invoice.id },
          payment_intent: intent_id,
          amount_total: invoice.amount,
          status: "complete",
          payment_status: "unpaid",
          currency: "inr"
        }
      },
      created: current_time.strftime("%s")
    }.to_dot
}

    subject { described_class.new(event).process }

    before do
      invoice4.update!(stripe_payment_intent: intent_id)
      subject
    end

    it "doesn't create the payment entry" do
      expect(Payment.last&.invoice&.id).not_to eq(invoice4.id)
    end
  end
end
