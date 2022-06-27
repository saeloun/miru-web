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
      create(:company_user, company:, user:)
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
            paidAmount: @client2_paid_amount,
            unpaidAmount: @client2_unpaid_amount,
            totalAmount: @client2_paid_amount + @client2_unpaid_amount
          },
           {
             name: client1.name,
             paidAmount: @client1_paid_amount,
             unpaidAmount: @client1_unpaid_amount,
             totalAmount: @client1_paid_amount + @client1_unpaid_amount
           }]

        expect(json_response["clients"]).to eq(JSON.parse(expected_clients.to_json))
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of all clients" do
        expected_summary = {
          totalPaidAmount: @client1_paid_amount + @client2_paid_amount,
          totalUnpaidAmount: @client1_unpaid_amount + @client2_unpaid_amount,
          totalRevenue: @client1_paid_amount + @client2_paid_amount + @client1_unpaid_amount + @client2_unpaid_amount
        }
        expect(json_response["summary"]).to eq(JSON.parse(expected_summary.to_json))
      end
    end
  end
end
