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
      visit = Ahoy::Visit.create!(
        visit_token: SecureRandom.uuid,
        visitor_token: SecureRandom.uuid,
        started_at: Time.current
      )
      Ahoy::Event.create!(
        name: "create_invoice",
        properties: { type: "invoice", id: invoice.id },
        time: Time.current,
        visit:,
        user_id: user.id
      )

      send_request :get, api_v1_invoices_action_trail_path(invoice),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("trails", 0, "user")).to eq(
        "id" => user.id,
        "email" => user.email
      )
      expect(json_response.dig("trails", 0, "user")).not_to have_key("token")
    end

    it "does not return another workspace's invoice trail" do
      other_company = create(:company)
      other_invoice = create(:invoice, company: other_company, client: create(:client, company: other_company))

      send_request :get, api_v1_invoices_action_trail_path(other_invoice),
        headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
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
