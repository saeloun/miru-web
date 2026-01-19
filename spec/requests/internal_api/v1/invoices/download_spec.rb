# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#download", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:) }
  let!(:invoice) { create(:invoice, client:, company:, status: "sent") }

  subject { send_request :get, download_internal_api_v1_invoice_path(id: invoice.id), headers: auth_headers(user) }

  context "when authenticated" do
    before do
      create(:employment, company:, user:)
      user.add_role role, company
      sign_in user
      # Mock PDF generation to avoid Chrome browser dependency
      pdf_service = instance_double(PdfGeneration::InvoiceService, process: "%PDF-1.4 mock pdf content")
      allow(PdfGeneration::InvoiceService).to receive(:new).and_return(pdf_service)
    end

    context "when user is admin" do
      let(:role) { :admin }

      it "downloads the invoice in PDF format" do
        subject
        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is employee" do
      let(:role) { :employee }

      it "returns 403 status" do
        subject
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user is book_keeper" do
      let(:role) { :book_keeper }

      it "downloads the invoice" do
        subject
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "when unauthenticated" do
    context "when request is made to download the Invoice" do
      it "returns 401 status" do
        send_request :get, download_internal_api_v1_invoice_path(id: invoice.id)
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
