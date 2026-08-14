# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::StripePaymentFailed, vcr: true do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) {
  create(
    :invoice, status: "sent", company:, client:,
    payment_infos: { "stripe_payment_intent" => "pi_3NIVZzENZof8Gnl10xirMpvw" })
}
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  describe "#process" do
    subject(:result) { described_class.new(object_payment).process }

    let(:object_payment) do
      stripe_connected_account.update_columns(account_id: "acct_1NIU5SENZof8Gnl1")
      payment_intent = Stripe::PaymentIntent.retrieve(
        invoice.stripe_payment_intent,
        { stripe_account: stripe_connected_account.account_id })

      json_payment = { data: { object: payment_intent.as_json }, created: 1686646712 }
      JSON.parse(json_payment.to_json, object_class: OpenStruct)
    end

    it "returns a Payment object" do
      expect(result.class).to eq(Payment)
    end

    it "creates the payment entry" do
      result

      expect(Payment.last.invoice.id).to eq(invoice.id)
      expect(Payment.last.status).to eq("failed")
      expect(Payment.last.name).not_to be_nil
    end

    it "does not create a second payment for a replayed event" do
      event = OpenStruct.new(
        id: "evt_payment_failed_123",
        created: Time.current.to_i,
        data: OpenStruct.new(
          object: OpenStruct.new(
            id: invoice.stripe_payment_intent,
            amount: 1000,
            currency: "inr",
            last_payment_error: nil
          )
        )
      )

      expect {
        2.times { described_class.process(event) }
      }.to change(Payment, :count).by(1)
    end

    it "acknowledges events that do not match an invoice" do
      event = OpenStruct.new(
        id: "evt_unmatched_payment_failed",
        created: Time.current.to_i,
        data: OpenStruct.new(
          object: OpenStruct.new(
            id: "pi_unmatched",
            amount: 1000,
            currency: "inr",
            last_payment_error: nil
          )
        )
      )

      expect(described_class.process(event)).to be(true)
      expect(Payment.where(provider_event_id: event.id)).not_to exist
    end
  end
end
