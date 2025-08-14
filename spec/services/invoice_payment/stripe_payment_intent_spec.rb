# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::StripePaymentIntent do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", company:, client:) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  describe "#process", :vcr do
    before do
      # Mock Stripe account instead of creating real one
      account = OpenStruct.new(
        id: "acct_test_#{SecureRandom.hex(8)}",
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
      )

      stripe_connected_account.update_columns(account_id: account.id)
    end

    before(:each, :checkout_session) do
      @checkout = invoice.create_checkout_session!(
        success_url: "https://example.com/invoices/#{invoice.id}/payments/success",
        cancel_url: cancel_invoice_payments_url(invoice, host: "https://example.com")
      )
    end

    subject { described_class.new(invoice).process }

    it "returns the stripe intent object", checkout_session: true do
      expect(subject.class).to eq(Stripe::PaymentIntent)
    end

    it "won't return stripe intent object when there is no associated invoice" do
      expect(subject).to eq(nil)
    end
  end
end
