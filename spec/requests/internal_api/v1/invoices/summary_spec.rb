# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#summary", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let (:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the invoices summary" do
      send_request :get, summary_internal_api_v1_invoices_path
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
    end

    it "is not be permitted to view invoices summary" do
      send_request :get, summary_internal_api_v1_invoices_path
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view invoices summary" do
      send_request :get, summary_internal_api_v1_invoices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
