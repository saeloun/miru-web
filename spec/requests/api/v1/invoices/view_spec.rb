# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::View#index", type: :request do
  describe "#show" do
    let(:company) { create(:company, :with_logo) }
    let(:client) { create(:client, company:) }
    let(:invoice) { create(:invoice, client:, company:, status: "sent") }

    context "when unauthenticated" do
      it "is able to view the client invoice successfully" do
        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
        expect(response).to be_successful
      end

      it "does not expose company financial details" do
        company.update!(
          bank_name: "QA Bank",
          bank_account_number: "12345678",
          bank_routing_number: "987654321",
          bank_swift_code: "QABKUS33",
          tax_id: "TAX-123",
          vat_number: "VAT-123",
          gst_number: "GST-123"
        )

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(response).to be_successful
        expect(json_response.dig("company", "bank_name")).to be_nil
        expect(json_response.dig("company", "bank_account_number")).to be_nil
        expect(json_response.dig("company", "bank_routing_number")).to be_nil
        expect(json_response.dig("company", "bank_swift_code")).to be_nil
        expect(json_response.dig("company", "tax_id")).to be_nil
        expect(json_response.dig("company", "vat_number")).to be_nil
        expect(json_response.dig("company", "gst_number")).to be_nil
      end
    end

    context "when the client viewed the invoice" do
      context "if the invoice status is 'sent'" do
        it "updates the invoice status to viewed" do
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "viewed"
        end
      end

      context "if the invoice status is not 'sent'" do
        it "does not update the invoice status to viewed and it should remain the same status" do
          invoice.update(status: "draft")
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "draft"
        end
      end
    end
  end
end
