# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::Waived#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, company:, client:, status: :sent) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "waives the invoice" do
      send_request :put, api_v1_invoices_waived_path(invoice),
        headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
      expect(invoice.reload.status).to eq("waived")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      send_request :put, api_v1_invoices_waived_path(invoice),
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :put, api_v1_invoices_waived_path(invoice)
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
