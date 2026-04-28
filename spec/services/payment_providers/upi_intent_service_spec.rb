# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::UpiIntentService do
  describe "#details" do
    let(:company) { create(:india_company, base_currency: "INR", name: "Saeloun") }
    let(:client) { create(:client, company:, currency: "INR") }
    let(:invoice) { create(:invoice, company:, client:, currency: "INR", invoice_number: "INV-42", amount: 1200, amount_due: 1200) }
    let(:provider) do
      create(
        :payments_provider,
        company:,
        name: PaymentsProvider::UPI_PROVIDER,
        enabled: true,
        connected: true,
        accepted_payment_methods: ["upi"],
        settings: {
          upi_id: "saeloun@upi",
          payee_name: "Saeloun",
          enabled_on_invoices: true
        }
      )
    end

    it "builds a branded UPI payment payload for an invoice" do
      details = described_class.new(provider:, invoice:).details

      expect(details[:upi_id]).to eq("saeloun@upi")
      expect(details[:payment_link]).to include("upi://pay?")
      expect(details[:payment_link]).to include("pa=saeloun%40upi")
      expect(details[:payment_link]).to include("am=1200.00")
      expect(details[:payment_link]).to include("tn=Invoice+INV-42")
      expect(details[:qr_code_svg]).to include("<svg")
      expect(details[:qr_code_data_uri]).to start_with("data:image/svg+xml;base64,")
    end
  end
end
