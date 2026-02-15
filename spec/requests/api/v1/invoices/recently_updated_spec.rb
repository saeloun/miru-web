# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::RecentlyUpdated#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      create_list(:invoice, 3, company:, client:, status: :sent)
    end

    it "returns recently updated invoices with pagination" do
      send_request :get, api_v1_invoices_recently_updated_index_path,
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response).to have_key("invoices")
      expect(json_response).to have_key("meta")
      expect(json_response["invoices"]).to be_an(Array)
      expect(json_response["meta"]).to have_key("total_count")
      expect(json_response["meta"]).to have_key("current_page")
    end

    it "respects pagination params" do
      send_request :get, api_v1_invoices_recently_updated_index_path,
        params: { page: 1, per_page: 2 },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["invoices"].length).to be <= 2
    end

    it "filters by status" do
      create(:invoice, company:, client:, status: :draft)
      send_request :get, api_v1_invoices_recently_updated_index_path,
        params: { status: "sent" },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      statuses = json_response["invoices"].pluck("status")
      expect(statuses).to all(eq("sent"))
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      send_request :get, api_v1_invoices_recently_updated_index_path,
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, api_v1_invoices_recently_updated_index_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
