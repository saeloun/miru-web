# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#summary", type: :request do
  let(:company) do
    create(:company,
           clients: create_list(:client, 10) { |client, i| client.id = i + 1 },
           invoices: create_list(:invoice, 10) do |invoice, i|
             invoice.status = i % 6
             invoice.client.id = i + 1
           end)
  end
  let (:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    it "should return the invoices summary" do
      send_request :get, "#{internal_api_v1_invoices_path}/summary"
      expect(response).to have_http_status(:ok)
      expect(json_response["company"]["name"]).to eq(company.name)
      expect(json_response["company"]["baseCurrency"]).to eq(company.base_currency)
      expect(json_response["company"]["dateFormat"]).to eq(company.date_format)
      expect(json_response["invoicesSummary"]["overdueAmount"]).to eq(company.invoices.select { |inv| inv.status == "overdue" }.sum { |inv| inv.amount }.to_s)
      expect(json_response["invoicesSummary"]["outstandingAmount"]).to eq(company.invoices.sum { |inv| inv.outstanding_amount }.to_s)
      expect(json_response["invoicesSummary"]["draftAmount"]).to eq(company.invoices.select { |inv| inv.status == "draft" }.sum { |inv| inv.amount }.to_s)
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
    end

    it "should not be permitted to view invoices summary" do
      send_request :get, "#{internal_api_v1_invoices_path}/summary"
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "should not be permitted to view invoices summary" do
      send_request :get, "#{internal_api_v1_invoices_path}/summary"
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
