# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Analytics::RevenueForecastsController#index", type: :request do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  before do
    travel_to Time.zone.local(2026, 4, 18, 12, 0, 0)
    create(:employment, company:, user:)
    create_invoice_and_payment(issue_date: Date.new(2026, 1, 10), amount: 100)
    create_invoice_and_payment(issue_date: Date.new(2026, 2, 10), amount: 200)
    create_invoice_and_payment(issue_date: Date.new(2026, 3, 10), amount: 300)
    sign_in user
  end

  after { travel_back }

  context "when the user is an admin" do
    before { user.add_role :admin, company }

    it "returns the revenue forecast data" do
      send_request :get, api_v1_analytics_revenue_forecasts_path,
        params: { horizon: 6 },
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["currency"]).to eq("USD")
      expect(json_response["horizon"]).to eq(6)
      expect(json_response["historical_periods"].size).to eq(12)
      expect(json_response["forecast_periods"].size).to eq(6)
      expect(json_response["historical_periods"].last(3).pluck("collected_revenue")).to eq([200.0, 300.0, 0.0])
      expect(json_response["forecast_periods"].first).to include(
        "month" => "2026-05-01",
        "forecast_revenue" => 166.67
      )
      expect(response.headers["X-Analytics-Canonical-Endpoint"]).to eq("/internal_api/v1/analytics/revenue_forecast")
      expect(response.headers["X-Analytics-Compatibility"]).to eq("true")
      expect(json_response["meta"]).to be_present
    end
  end

  context "when the user is an owner" do
    before { user.add_role :owner, company }

    it "allows access" do
      send_request :get, api_v1_analytics_revenue_forecasts_path, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
    end
  end

  context "when the user is a book keeper" do
    before { user.add_role :book_keeper, company }

    it "allows access to financial analytics" do
      send_request :get, api_v1_analytics_revenue_forecasts_path, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
    end
  end

  context "when the user is an employee" do
    before { user.add_role :employee, company }

    it "forbids access to company revenue forecasts" do
      send_request :get, api_v1_analytics_revenue_forecasts_path, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is a client" do
    before { user.add_role :client, company }

    it "forbids access" do
      send_request :get, api_v1_analytics_revenue_forecasts_path, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  private

    def create_invoice_and_payment(issue_date:, amount:)
      invoice = create(
        :invoice,
        company:,
        client:,
        issue_date:,
        due_date: issue_date + 15.days,
        amount:,
        amount_due: 0,
        amount_paid: amount,
        base_currency_amount: amount,
        status: :paid
      )

      create(
        :payment,
        invoice:,
        amount:,
        base_currency_amount: amount,
        transaction_date: issue_date,
        status: :paid,
        transaction_type: :bank_transfer
      )
    end
end
