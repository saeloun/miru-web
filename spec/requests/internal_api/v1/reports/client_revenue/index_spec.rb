# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports::ClientRevenuesController::#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, :with_logo, company:, name: "Alpha") }
  let!(:client2) { create(:client, :with_logo, company:, name: "Delta") }
  let(:client3) { create(:client, company:, name: "john") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent", issue_date: 2.weeks.ago) }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, status: "sent", issue_date: 2.weeks.ago) }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, status: "viewed", issue_date: 2.weeks.ago) }
  let!(:client1_paid_invoice1) { create(:invoice, client: client1, status: "paid", issue_date: 2.weeks.ago) }
  let!(:client1_paid_invoice2) { create(:invoice, client: client1, status: "paid", issue_date: 2.weeks.ago) }
  let!(:client2_overdue_invoice1) { create(:invoice, client: client2, status: "overdue", issue_date: 2.weeks.ago) }
  let!(:client1_overdue_invoice1) { create(:invoice, client: client1, status: "overdue", issue_date: 2.weeks.ago) }
  let!(:client2_sent_invoice2) { create(:invoice, client: client2, status: "sent", issue_date: 2.weeks.ago) }
  let!(:client2_viewed_invoice1) { create(:invoice, client: client2, status: "viewed", issue_date: 2.weeks.ago) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:project, billable: true, client: client1)
      create(:project, billable: true, client: client2)
      create(:project, client: client1)
      create(:project, client: client3)
      user.add_role :admin, company
      sign_in user
    end

    context "when reports page's request is made" do
      before do
        @client1_paid_amount = client1_paid_invoice1.amount + client1_paid_invoice2.amount
        @client1_unpaid_amount = client1_viewed_invoice1.amount + client1_sent_invoice1.amount +
                                 client1_sent_invoice2.amount
        @client1_overdue_amount = client1_overdue_invoice1.amount
        @client2_overdue_amount = client2_overdue_invoice1.amount

        @client2_paid_amount = 0
        @client2_unpaid_amount = client2_sent_invoice2.amount + client2_viewed_invoice1.amount
        @expected_clients =
          [{
            logo: client1.logo_url,
            name: client1.name,
            paidAmount: @client1_paid_amount,
            outstandingAmount: @client1_unpaid_amount,
            totalAmount: @client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount,
            overdueAmount: @client1_overdue_amount
          },
           {
             logo: client2.logo_url,
             name: client2.name,
             paidAmount: @client2_paid_amount,
             outstandingAmount: @client2_unpaid_amount,
             totalAmount: @client2_paid_amount + @client2_unpaid_amount + @client2_overdue_amount,
             overdueAmount: @client2_overdue_amount
           }]
        get internal_api_v1_reports_client_revenues_path,
          params: { from_date: 1.month.ago, to_date: Date.today },
          headers: auth_headers(user)
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the billable clients data in alaphabetical order with amount details" do
        expect(json_response["clients"]).to eq(JSON.parse(@expected_clients.to_json))
      end

      it "does not return non billable clients data" do
        expect(json_response["clients"].pluck("name")).not_to include(client3.name)
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of all clients" do
        expected_summary = {
          totalPaidAmount: @client1_paid_amount + @client2_paid_amount,
          totalOutstandingAmount: @client1_unpaid_amount + @client2_unpaid_amount + @client1_overdue_amount +
                                  @client2_overdue_amount,
          totalRevenue: @client1_paid_amount + @client2_paid_amount + @client1_unpaid_amount + @client2_unpaid_amount +
                        @client1_overdue_amount + @client2_overdue_amount
        }
        expect(json_response["summary"]).to eq(JSON.parse(expected_summary.to_json))
      end
    end

    context "when reports page's request is made with client_ids" do
      before do
        @client1_paid_amount = client1_paid_invoice1.amount + client1_paid_invoice2.amount
        @client1_unpaid_amount = client1_viewed_invoice1.amount + client1_sent_invoice1.amount +
                                 client1_sent_invoice2.amount
        @client1_overdue_amount = client1_overdue_invoice1.amount

        get internal_api_v1_reports_client_revenues_path,
          params: { client_ids: [client1.id].to_json, from_date: 1.month.ago, to_date: Date.today },
          headers: auth_headers(user)
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the clients data in alaphabetical order with amount details" do
        expected_clients =
          [
            {
              name: client1.name,
              logo: client1.logo_url,
              paidAmount: @client1_paid_amount,
              outstandingAmount: @client1_unpaid_amount,
              totalAmount: @client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount,
              overdueAmount: @client1_overdue_amount
            }
          ]
        expect(json_response["clients"]).to eq(JSON.parse(expected_clients.to_json))
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of first client" do
        expected_summary = {
          totalPaidAmount: @client1_paid_amount,
          totalOutstandingAmount: @client1_unpaid_amount + @client1_overdue_amount,
          totalRevenue: @client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount
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
      send_request :get, internal_api_v1_reports_client_revenues_path, headers: auth_headers(user)
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
      send_request :get, internal_api_v1_reports_client_revenues_path, headers: auth_headers(user)
    end

    it "is permitted to view client revenue report" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view client revenue report" do
      send_request :get, internal_api_v1_reports_client_revenues_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
