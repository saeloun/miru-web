# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices::BulkDownbload#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:) }
  let!(:invoice) { create(:invoice, client:, status: "sent") }
  let(:download_id) { Faker::Alphanumeric.unique.alpha(number: 10) }

  subject { send_request :post, internal_api_v1_invoices_bulk_download_index_path(
    bulk_invoices: {
      invoice_ids: [invoice.id],
      download_id:
    })
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
        expect(BulkInvoiceDownloadJob).to be_processed_in :default
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

      it "returns 403 status" do
        subject
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end
  end

  context "when unauthenticated" do
    context "when request is made to download the Invoice" do
      it "returns 403 status" do
        subject
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
