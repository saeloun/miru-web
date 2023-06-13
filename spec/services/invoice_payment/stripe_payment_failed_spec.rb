# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::StripePaymentFailed do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) {
  create(
    :invoice, status: "sent", company:, client:,
    payment_infos: { "stripe_payment_intent" => "pi_3NIVZzENZof8Gnl10xirMpvw" })
}
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  describe "#process", :vcr do
    before do
      stripe_connected_account.update_columns(account_id: "acct_1NIU5SENZof8Gnl1")
      payment_intent = Stripe::PaymentIntent.retrieve(
        invoice.stripe_payment_intent,
        { stripe_account: stripe_connected_account.account_id })

      json_payment = { data: { object: payment_intent.as_json }, created: 1686646712 }
      object_payment = JSON.parse(json_payment.to_json, object_class: OpenStruct)

      @subject = described_class.new(object_payment).process
    end

    it "returns a Payment object" do
      expect(@subject.class).to eq(Payment)
    end

    it "creates the payment entry" do
        expect(Payment.last.invoice.id).to eq(invoice.id)
        expect(Payment.last.status).to eq("failed")
        expect(Payment.last.name).not_to be_nil
      end
  end
end
