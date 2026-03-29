# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::BulkDownbload#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:) }
  let!(:invoice) { create(:invoice, client:, status: "sent") }
  let(:download_id) { Faker::Alphanumeric.unique.alpha(number: 10) }

  subject {
  send_request :get, api_v1_invoices_bulk_download_index_path, params: {
    bulk_invoices: {
      invoice_ids: [invoice.id],
      download_id:
    }
  }, headers: auth_headers(user)
}

  context "when authenticated" do
    before do
      create(:employment, company:, user:)
      user.add_role role, company
      sign_in user
    end

    context "when user is admin" do
      let(:role) { :admin }

      before do
        subject
      end

      it "send the download request successfully" do
        subject
        expect(response).to have_http_status(:accepted)
      end

      it "check if bulk invoice download job is queued" do
        subject
        expect(BulkInvoiceDownloadJob).to have_been_enqueued.on_queue("default")
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

        it "send the download request successfully" do
          subject
          expect(response).to have_http_status(:accepted)
        end

        it "check if bulk invoice download job is queued" do
          subject
          expect(BulkInvoiceDownloadJob).to have_been_enqueued.on_queue("default")
        end
      end
  end

  context "when unauthenticated" do
    context "when request is made to download the Invoice" do
      it "returns 403 status" do
        send_request :get, api_v1_invoices_bulk_download_index_path, params: {
          bulk_invoices: {
            invoice_ids: [invoice.id],
            download_id:
          }
        }
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
