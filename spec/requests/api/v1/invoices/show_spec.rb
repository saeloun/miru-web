# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#show", type: :request do
  let(:company) do
    create(:company_with_invoices)
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the invoice" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
