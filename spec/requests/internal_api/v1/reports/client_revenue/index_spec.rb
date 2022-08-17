# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports::ClientRevenuesController::#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client2) { create(:client, company:, name: "alpha") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, status: "viewed") }
  let!(:client1_paid_invoice1) { create(:invoice, client: client1, status: "paid") }
  let!(:client1_paid_invoice2) { create(:invoice, client: client1, status: "paid") }
  let!(:client2_overdue_invoice1) { create(:invoice, client: client2, status: "overdue") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when reports page's request is made" do
      before do
        @client1_paid_amount = client1_paid_invoice1.amount + client1_paid_invoice2.amount
        @client1_unpaid_amount = client1_viewed_invoice1.amount + client1_sent_invoice1.amount +
                                 client1_sent_invoice2.amount
        @client2_paid_amount = 0
        @client2_unpaid_amount = client2_overdue_invoice1.amount
        get internal_api_v1_reports_client_revenues_path
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the clients data in alaphabetical order with amount details" do
        expected_clients =
          [{
            name: client2.name,
            paidAmount: 0,
            unpaidAmount: 0,
            totalAmount: 0
          },
           {
             name: client1.name,
             paidAmount: 0,
             unpaidAmount: 0,
             totalAmount: 0
           }
        ]
        expect(json_response["clients"]).to eq(JSON.parse(expected_clients.to_json))
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of all clients" do
        expected_summary = {
          totalPaidAmount: 0,
          totalUnpaidAmount: 0,
          totalRevenue: 0
        }
        expect(json_response["summary"]).to eq(JSON.parse(expected_summary.to_json))
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_reports_client_revenues_path
    end

    it "is not permitted to view client revenue report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_reports_client_revenues_path
    end

    it "is not permitted to view client revenue report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view client revenue report" do
      send_request :get, internal_api_v1_reports_client_revenues_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
