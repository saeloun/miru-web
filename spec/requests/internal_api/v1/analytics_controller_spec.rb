# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::AnalyticsController", type: :request do
  let(:company) { create(:company, base_currency: "USD", working_days: "5", working_hours: "40") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }

  before do
    travel_to Time.zone.local(2026, 4, 18, 12, 0, 0)
    create(:employment, company:, user:, joined_at: Date.new(2026, 1, 1), resigned_at: nil)

    invoice = create(:invoice, company:, client:, issue_date: Date.new(2026, 4, 5), due_date: Date.new(2026, 4, 25), amount: 300, amount_due: 0, amount_paid: 300, base_currency_amount: 300, status: :paid)
    create(:payment, invoice:, amount: 300, base_currency_amount: 300, transaction_date: Date.new(2026, 4, 10), status: :paid, transaction_type: :bank_transfer)

    timesheet_entry = create(:timesheet_entry, user:, project:, duration: 240, work_date: Date.new(2026, 4, 7), bill_status: :unbilled)
    create(:invoice_line_item, invoice:, timesheet_entry:, quantity: 240, rate: 75, date: Date.new(2026, 4, 7))
    create(:expense, company:, project:, date: Date.new(2026, 4, 8), amount: 125)

    sign_in user
  end

  after { travel_back }

  context "when user is admin" do
    before { user.add_role :admin, company }

    it "returns revenue forecast" do
      send_request :get, "/internal_api/v1/analytics/revenue_forecast", params: { horizon: 6 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["horizon"]).to eq(6)
      expect(json_response["meta"]).to be_present
    end

    it "returns comparison metrics" do
      send_request :get, "/internal_api/v1/analytics/comparison", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["metrics"]).to include("collected_revenue", "total_expenses", "utilization_rate")
    end

    it "returns client analysis" do
      send_request :get, "/internal_api/v1/analytics/client_analysis", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["clients"].first["average_invoice_amount"]).to eq(300.0)
    end

    it "returns team productivity" do
      send_request :get, "/internal_api/v1/analytics/team_productivity", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["summary"]).to include("utilization_rate", "average_hourly_rate")
    end

    it "returns expense trends" do
      send_request :get, "/internal_api/v1/analytics/expense_trends", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["category_trends"]).to be_present
      expect(json_response["anomalies"]).to be_an(Array)
    end
  end

  context "when user is employee" do
    before { user.add_role :employee, company }

    it "allows self team productivity analytics" do
      send_request :get, "/internal_api/v1/analytics/team_productivity", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["members"].pluck("user_id")).to eq([user.id])
    end

    it "forbids company revenue forecast" do
      send_request :get, "/internal_api/v1/analytics/revenue_forecast", headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids comparison analytics" do
      send_request :get, "/internal_api/v1/analytics/comparison", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids client analytics" do
      send_request :get, "/internal_api/v1/analytics/client_analysis", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids expense trends" do
      send_request :get, "/internal_api/v1/analytics/expense_trends", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is client" do
    before { user.add_role :client, company }

    it "forbids revenue forecast" do
      send_request :get, "/internal_api/v1/analytics/revenue_forecast", headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids comparison analytics" do
      send_request :get, "/internal_api/v1/analytics/comparison", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids client analytics" do
      send_request :get, "/internal_api/v1/analytics/client_analysis", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids team productivity analytics" do
      send_request :get, "/internal_api/v1/analytics/team_productivity", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end

    it "forbids expense trends" do
      send_request :get, "/internal_api/v1/analytics/expense_trends", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when params are invalid" do
    before { user.add_role :book_keeper, company }

    it "returns validation errors for unsupported horizon" do
      send_request :get, "/internal_api/v1/analytics/revenue_forecast", params: { horizon: 9 }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]).to include("horizon")
    end

    it "returns validation errors for invalid dates" do
      send_request :get, "/internal_api/v1/analytics/comparison", params: { from: "bad-date", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns validation errors when from is after to" do
      send_request :get, "/internal_api/v1/analytics/comparison", params: { from: "2026-04-19", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]).to include("from must be before or equal to to")
    end
  end
end
