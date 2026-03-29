# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "bob") }
  let!(:invoice) { create(:invoice, client:, company:, status: "sent") }
  let!(:payment) { create(:payment, invoice:, status: "paid") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the payment" do
      send_request :get, api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("payment", "id")).to eq(payment.id)
      expect(json_response.dig("payment", "invoiceId")).to eq(invoice.id)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "returns the payment" do
      send_request :get, api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("payment", "id")).to eq(payment.id)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "returns forbidden" do
      send_request :get, api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
