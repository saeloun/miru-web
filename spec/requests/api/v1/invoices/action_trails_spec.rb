# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::ActionTrails#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, company:, client:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns action trails for the invoice" do
      send_request :get, api_v1_invoices_action_trail_path(invoice),
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      send_request :get, api_v1_invoices_action_trail_path(invoice),
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, api_v1_invoices_action_trail_path(invoice)
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
