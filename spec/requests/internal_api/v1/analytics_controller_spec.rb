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

    it "logs analytics page views" do
      expect {
        send_request :get,
          "/internal_api/v1/analytics/client_analysis",
          params: { from: "2026-04-01", to: "2026-04-18", view_context: "client_analysis" },
          headers: auth_headers(user)
      }.to change(Ahoy::Event, :count).by(1)

      event = Ahoy::Event.order(:id).last
      expect(event.name).to eq("view_analytics")
      expect(event.properties).to include(
        "type" => "analytics",
        "page_type" => "client_analysis",
        "report_type" => "client_analysis",
        "company_id" => company.id,
        "user_id" => user.id
      )
    end

    it "can skip tracking for supporting dashboard queries" do
      expect {
        send_request :get,
          "/internal_api/v1/analytics/team_productivity",
          params: { from: "2026-04-01", to: "2026-04-18", track_view: false },
          headers: auth_headers(user)
      }.not_to change(Ahoy::Event, :count)
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

  context "when user is manager" do
    let(:managed_user) { create(:user, current_workspace_id: company.id) }
    let(:other_user) { create(:user, current_workspace_id: company.id) }
    let(:managed_client) { create(:client, company:, name: "Managed Client") }
    let(:other_client) { create(:client, company:, name: "Other Client") }
    let(:managed_project) { create(:project, client: managed_client, billable: true) }
    let(:other_project) { create(:project, client: other_client, billable: true) }

    before do
      create(:employment, company:, user: managed_user, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
      create(:employment, company:, user: other_user, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
      create(:project_member, user: user, project: managed_project)
      create(:project_member, user: managed_user, project: managed_project)
      create(:project_member, user: other_user, project: other_project)

      managed_invoice = create(:invoice, company:, client: managed_client, issue_date: Date.new(2026, 4, 5), due_date: Date.new(2026, 4, 25), amount: 400, amount_due: 0, amount_paid: 400, base_currency_amount: 400, status: :paid)
      other_invoice = create(:invoice, company:, client: other_client, issue_date: Date.new(2026, 4, 6), due_date: Date.new(2026, 4, 25), amount: 500, amount_due: 0, amount_paid: 500, base_currency_amount: 500, status: :paid)
      create(:payment, invoice: managed_invoice, amount: 400, base_currency_amount: 400, transaction_date: Date.new(2026, 4, 10), status: :paid, transaction_type: :bank_transfer)
      create(:payment, invoice: other_invoice, amount: 500, base_currency_amount: 500, transaction_date: Date.new(2026, 4, 10), status: :paid, transaction_type: :bank_transfer)
      create(:timesheet_entry, user: managed_user, project: managed_project, duration: 120, work_date: Date.new(2026, 4, 8), bill_status: :unbilled)
      create(:timesheet_entry, user: other_user, project: other_project, duration: 240, work_date: Date.new(2026, 4, 8), bill_status: :unbilled)
      create(:expense, company:, project: managed_project, date: Date.new(2026, 4, 8), amount: 50)
      create(:expense, company:, project: other_project, date: Date.new(2026, 4, 8), amount: 90)

      user.add_role :manager, company
    end

    it "allows access but scopes analytics to managed team data" do
      send_request :get, "/internal_api/v1/analytics/team_productivity", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["members"].pluck("user_id")).to include(user.id, managed_user.id)
      expect(json_response["members"].pluck("user_id")).not_to include(other_user.id)

      send_request :get, "/internal_api/v1/analytics/client_analysis", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["clients"].pluck("client_name")).to include("Managed Client")
      expect(json_response["clients"].pluck("client_name")).not_to include("Other Client")

      send_request :get, "/internal_api/v1/analytics/expense_trends", params: { from: "2026-04-01", to: "2026-04-18" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["project_trends"].pluck("name")).to include(managed_project.name)
      expect(json_response["project_trends"].pluck("name")).not_to include(other_project.name)
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
