# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#show", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the invoice" do
      send_request :get, internal_api_v1_invoice_path(company.clients.first.invoices.first.id)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_invoice_path(company.clients.first.invoices.first.id)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_invoice_path(company.clients.first.invoices.first.id)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_invoice_path(company.clients.first.invoices.first.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
