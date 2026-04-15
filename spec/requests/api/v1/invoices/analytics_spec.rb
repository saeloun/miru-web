# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::Analytics", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  describe "GET #monthly_revenue" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        create(:invoice, company:, client:, status: :sent, issue_date: Date.current)
      end

      it "returns monthly revenue data" do
        send_request :get, monthly_revenue_api_v1_invoices_analytics_path,
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("chart_data")
        expect(json_response).to have_key("statistics")
        expect(json_response).to have_key("period")
        expect(json_response["chart_data"]).to be_an(Array)
        expect(json_response["chart_data"].length).to eq(12)
        expect(json_response["statistics"]).to include(
          "current_month_revenue",
          "current_month_invoices",
          "current_month_label",
          "trend"
        )
      end
    end

    context "when user is a book_keeper" do
      before do
        create(:employment, company:, user:)
        user.add_role :book_keeper, company
        sign_in user
      end

      it "returns monthly revenue data" do
        send_request :get, monthly_revenue_api_v1_invoices_analytics_path,
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
        send_request :get, monthly_revenue_api_v1_invoices_analytics_path,
          headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :get, monthly_revenue_api_v1_invoices_analytics_path
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET #revenue_by_status" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        create(:invoice, company:, client:, status: :sent, issue_date: Date.current)
        create(:invoice, company:, client:, status: :draft, issue_date: Date.current)
      end

      it "returns revenue grouped by status" do
        send_request :get, revenue_by_status_api_v1_invoices_analytics_path,
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response).to have_key("status_data")
        expect(json_response).to have_key("total")
        expect(json_response).to have_key("currency")
        expect(json_response["status_data"]).to be_an(Array)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :get, revenue_by_status_api_v1_invoices_analytics_path
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
