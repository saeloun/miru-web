# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::GeneratInvoice#index", type: :request do
  let(:company) { create :company, :with_logo }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_generate_invoice_index_path
    end

    it "returns the company details and list of clients" do
      company_details = {
        id: user.current_workspace.id,
        logo: polymorphic_url(user.current_workspace.logo),
        name: user.current_workspace.name,
        phone_number: user.current_workspace.business_phone,
        address: user.current_workspace.address,
        country: user.current_workspace.country,
        currency: user.current_workspace.base_currency
      }
      company_client_list = user.current_workspace.client_list
      expect(response).to have_http_status(:ok)
      expect(json_response["company_details"]).to eq(JSON.parse(company_details.to_json))
      expect(json_response["company_client_list"]).to eq(JSON.parse(company_client_list.to_json))
      expect(json_response["issue_date"]).to eq(JSON.parse(Date.current.to_json))
      expect(json_response["due_date"]).to eq(JSON.parse((Date.current + 30).to_json))
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_generate_invoice_index_path
    end

    it "is not permitted to view time entry report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_reports_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
