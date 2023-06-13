# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::StripeCheckoutFailed do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", company:, client:) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  describe "#process", :vcr do
    before do
      stripe_connected_account.update_columns(account_id: "acct_1NIU5SENZof8Gnl1")
      invoice_checkout = invoice.create_checkout_session!(
        success_url: "https://example.com/invoices/#{invoice.id}/payments/success",
        cancel_url: cancel_invoice_payments_url(invoice, host: "https://example.com")
      )

      expired_checkout = Stripe::Checkout::Session.expire(
        invoice_checkout.id, {},
        { stripe_account: stripe_connected_account.account_id })

      json_expired = { data: { object: expired_checkout.as_json }, created: 1686646712 }
      object_expired = JSON.parse(json_expired.to_json, object_class: OpenStruct)

      @subject = described_class.new(object_expired).process
    end

    it "returns a Payment object" do
      expect(@subject.class).to eq(Payment)
    end

    it "creates the payment entry" do
        expect(Payment.last.invoice.id).to eq(invoice.id)
        expect(Payment.last.status).to eq("cancelled")
        expect(Payment.last.name).to be_nil
      end
  end
end
