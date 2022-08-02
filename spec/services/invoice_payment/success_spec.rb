# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::Success do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", company:, client:) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  describe "#process", :vcr do
    before do
      account = Stripe::Account.create(
        {
          type: "custom",
          country: "US",
          email: "jenny.rosen@example.com",
          business_type: "company",
          company: {
            name: "test company"
          },
          business_profile: {
            name: "test company",
            url: "https://exampletest.com"
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          }
        })

      stripe_connected_account.update_columns(account_id: account.id)
    end

    before(:each, :checkout_session) do
      @checkout = invoice.create_checkout_session!(
        success_url: success_invoice_payments_url(invoice, host: "https://example.com"),
        cancel_url: cancel_invoice_payments_url(invoice, host: "https://example.com")
      )
    end

    subject { described_class.new(invoice).process }

    it "updates invoice as paid by confirming payment in stripe", checkout_session: true do
      expect(subject).to eq(true)
      expect(invoice.reload.status).to eq("paid")
    end

    it "updates invoice with payment intent to paid status by confirming payment in stripe", checkout_session: true do
      invoice.update(stripe_payment_intent: "pi_3LIrtn2SBHFmsqvE1s6yyBrq")
      expect(subject).to eq(true)
      expect(invoice.reload.status).to eq("paid")
    end

    it "invoice will be in sent status until payment is complete through checkout page", checkout_session: true do
      expect(subject).to eq(false)
      expect(invoice.reload.status).to eq("sent")
    end

    it "invoice will be in sent status even when checkout session is not created" do
      expect(subject).to eq(false)
      expect(invoice.reload.status).to eq("sent")
    end
  end
end
