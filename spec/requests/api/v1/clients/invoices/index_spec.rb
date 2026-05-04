# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Clients::Invoices#index", type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }

  context "when user has client role" do
    let(:user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user:)
      create(:client_member, client:, user:, company:)
      user.add_role :client, company
      sign_in user
    end

    it "returns invoices for the client" do
      create(:invoice, company:, client:, status: :sent)
      get invoices_api_v1_clients_path, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end

    it "filters the full client invoice scope by query before pagination" do
      create(:invoice, company:, client:, invoice_number: "AC-001", status: :sent)
      matching_invoice = create(:invoice, company:, client:, invoice_number: "AC-003", status: :sent)
      create(:invoice, company:, client:, invoice_number: "BC-003", status: :sent)

      get invoices_api_v1_clients_path(invoices_per_page: 1, page: 1, query: "ac-003"),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["invoices"].pluck("id")).to eq([matching_invoice.id])
      expect(json_response.dig("pagy", "count")).to eq(1)
    end
  end

  context "when user is an admin without client membership" do
    let(:admin) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: admin)
      admin.add_role :admin, company
      sign_in admin
    end

    it "is not permitted without client role" do
      get invoices_api_v1_clients_path, headers: auth_headers(admin)
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("No clients associated")
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      get invoices_api_v1_clients_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
