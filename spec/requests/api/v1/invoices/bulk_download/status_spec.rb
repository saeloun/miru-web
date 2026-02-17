# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::BulkDownload#status", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:download_id) { Faker::Alphanumeric.unique.alpha(number: 10) }
  let(:bulk_download_status) { create(:bulk_invoice_download_status, download_id:, status: "processing") }

  subject do
    send_request :get, status_api_v1_invoices_bulk_download_index_path(download_id:),
      headers: auth_headers(user)
  end

  context "when authenticated" do
    before do
      create(:employment, company:, user:)
      user.add_role role, company
      sign_in user
    end

    context "when user is admin" do
      let(:role) { :admin }

      context "when download status is found" do
        before do
          bulk_download_status
          subject
        end

        it "returns the current download status" do
          expect(response).to have_http_status(:ok)
          expect(json_response["status"]).to eq("processing")
        end
      end

      context "when download status is not found" do
        before do
          subject
        end

        it "returns a status not found message" do
          expect(response).to have_http_status(:ok)
          expect(json_response["status"]).to eq("not_found")
        end
      end
    end

    context "when user is employee" do
      let(:role) { :employee }

      it "returns 403 status" do
        subject
        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user is book_keeper" do
      let(:role) { :book_keeper }

      context "when download status is found" do
        before do
          bulk_download_status
          subject
        end

        it "returns the current download status" do
          expect(response).to have_http_status(:ok)
          expect(json_response["status"]).to eq("processing")
        end
      end

      context "when download status is not found" do
        before do
          subject
        end

        it "returns a status not found message" do
          expect(response).to have_http_status(:ok)
          expect(json_response["status"]).to eq("not_found")
        end
      end
    end
  end

  context "when unauthenticated" do
    it "returns 403 status" do
      send_request :get, status_api_v1_invoices_bulk_download_index_path(download_id:)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
