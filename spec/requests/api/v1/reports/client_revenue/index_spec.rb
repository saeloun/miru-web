# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Reports::ClientRevenuesController::#index", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "Alpha") }
  let!(:client2) { create(:client, company:, name: "Delta") }
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
            id: client1.id,
            logo: client1.logo_url,
            name: client1.name,
            paid_amount: @client1_paid_amount.to_f,
            outstanding_amount: @client1_unpaid_amount.to_f,
            total_revenue: (@client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount).to_f,
            overdue_amount: @client1_overdue_amount.to_f
          },
           {
             id: client2.id,
             logo: client2.logo_url,
             name: client2.name,
             paid_amount: @client2_paid_amount.to_f,
             outstanding_amount: @client2_unpaid_amount.to_f,
             total_revenue: (@client2_paid_amount + @client2_unpaid_amount + @client2_overdue_amount).to_f,
             overdue_amount: @client2_overdue_amount.to_f
           }]
        get api_v1_reports_client_revenues_path,
          params: { from_date: 1.month.ago, to_date: Date.today },
          headers: auth_headers(user)
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the billable clients data in alaphabetical order with amount details" do
        expect(json_response["clients"]).to eq(@expected_clients.as_json)
      end

      it "does not return non billable clients data" do
        expect(json_response["clients"].pluck("name")).not_to include(client3.name)
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of all clients" do
        expected_summary = {
          totalPaidAmount: (@client1_paid_amount + @client2_paid_amount).to_f,
          totalOutstandingAmount: (@client1_unpaid_amount + @client2_unpaid_amount + @client1_overdue_amount +
                                  @client2_overdue_amount).to_f,
          totalRevenue: (@client1_paid_amount + @client2_paid_amount + @client1_unpaid_amount + @client2_unpaid_amount +
                        @client1_overdue_amount + @client2_overdue_amount).to_f,
          totalOverdueAmount: (@client1_unpaid_amount + @client2_unpaid_amount + @client1_overdue_amount +
                              @client2_overdue_amount).to_f
        }
        expect(json_response["summary"]).to eq(expected_summary.as_json)
      end
    end

    context "when reports page's request is made with client_ids" do
      before do
        @client1_paid_amount = client1_paid_invoice1.amount + client1_paid_invoice2.amount
        @client1_unpaid_amount = client1_viewed_invoice1.amount + client1_sent_invoice1.amount +
                                 client1_sent_invoice2.amount
        @client1_overdue_amount = client1_overdue_invoice1.amount

        get api_v1_reports_client_revenues_path,
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
              id: client1.id,
              name: client1.name,
              logo: client1.logo_url,
              paid_amount: @client1_paid_amount.to_f,
              outstanding_amount: @client1_unpaid_amount.to_f,
              total_revenue: (@client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount).to_f,
              overdue_amount: @client1_overdue_amount.to_f
            }
          ]
        expect(json_response["clients"]).to eq(expected_clients.as_json)
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of first client" do
        expected_summary = {
          totalPaidAmount: @client1_paid_amount.to_f,
          totalOutstandingAmount: (@client1_unpaid_amount + @client1_overdue_amount).to_f,
          totalRevenue: (@client1_paid_amount + @client1_unpaid_amount + @client1_overdue_amount).to_f,
          totalOverdueAmount: (@client1_unpaid_amount + @client1_overdue_amount).to_f
        }
        expect(json_response["summary"]).to eq(expected_summary.as_json)
      end

      it "accepts comma-separated client ids for filtering" do
        send_request :get, api_v1_reports_client_revenues_path,
          params: { client_ids: client1.id.to_s, from_date: 1.month.ago, to_date: Date.today },
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["clients"].pluck("name")).to eq([client1.name])
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_reports_client_revenues_path, headers: auth_headers(user)
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
      send_request :get, api_v1_reports_client_revenues_path, headers: auth_headers(user)
    end

    it "is permitted to view client revenue report" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view client revenue report" do
      send_request :get, api_v1_reports_client_revenues_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
