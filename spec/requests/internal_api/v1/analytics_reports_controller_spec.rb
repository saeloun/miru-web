# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::AnalyticsReportsController", type: :request do
  let(:company) { create(:company) }
  let(:creator) { create(:user, current_workspace_id: company.id) }
  let(:viewer) { create(:user, current_workspace_id: company.id) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let!(:own_report) do
    create(
      :analytics_report,
      company:,
      creator:,
      name: "Revenue snapshot",
      report_type: :revenue_forecast,
      filters: { "horizon" => 6 }
    )
  end
  let!(:team_report) do
    create(
      :analytics_report,
      company:,
      creator:,
      name: "Team snapshot",
      report_type: :team_productivity,
      filters: { "preset" => "custom", "from" => "2026-04-01", "to" => "2026-04-18" }
    )
  end

  before do
    create(:employment, company:, user: creator)
    create(:employment, company:, user: viewer)
    create(:employment, company:, user: client_user)
    creator.add_role :admin, company
    viewer.add_role :employee, company
    client_user.add_role :client, company
  end

  describe "GET /internal_api/v1/analytics/reports" do
    it "lists workspace saved analytics reports" do
      sign_in creator

      send_request :get, "/internal_api/v1/analytics/reports", headers: auth_headers(creator)

      expect(response).to have_http_status(:ok)
      expect(json_response["reports"]).to include(
        include("name" => "Revenue snapshot", "report_type" => "revenue_forecast"),
        include("name" => "Team snapshot", "report_type" => "team_productivity")
      )
    end

    it "forbids clients" do
      sign_in client_user

      send_request :get, "/internal_api/v1/analytics/reports", headers: auth_headers(client_user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /internal_api/v1/analytics/reports" do
    it "creates a saved report for allowed analytics types" do
      sign_in creator

      send_request :post,
        "/internal_api/v1/analytics/reports",
        headers: auth_headers(creator),
        params: {
          analytics_report: {
            name: "Saved team view",
            report_type: "team_productivity",
            filters: {
              "preset" => "custom",
              "from" => "2026-04-01",
              "to" => "2026-04-18",
              "members" => "1,2"
            }
          }
        }

      expect(response).to have_http_status(:created)
      expect(json_response["report"]).to include(
        "name" => "Saved team view",
        "report_type" => "team_productivity"
      )
    end

    it "prevents employee users from saving financial reports" do
      sign_in viewer

      send_request :post,
        "/internal_api/v1/analytics/reports",
        headers: auth_headers(viewer),
        params: {
          analytics_report: {
            name: "Forbidden report",
            report_type: "revenue_forecast",
            filters: { "horizon" => 6 }
          }
        }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /internal_api/v1/analytics/reports/:id" do
    it "allows other workspace users to load an allowed saved report" do
      sign_in viewer

      send_request :get,
        "/internal_api/v1/analytics/reports/#{team_report.id}",
        headers: auth_headers(viewer)

      expect(response).to have_http_status(:ok)
      expect(json_response["report"]).to include(
        "name" => "Team snapshot",
        "can_delete" => false
      )
    end

    it "prevents employees from opening financial saved reports" do
      sign_in viewer

      send_request :get,
        "/internal_api/v1/analytics/reports/#{own_report.id}",
        headers: auth_headers(viewer)

      expect(response).to have_http_status(:not_found)
    end

    it "logs saved report opens" do
      sign_in creator

      expect {
        send_request :get,
          "/internal_api/v1/analytics/reports/#{own_report.id}",
          headers: auth_headers(creator)
      }.to change(Ahoy::Event, :count).by(1)

      event = Ahoy::Event.order(:id).last
      expect(event.name).to eq("view_saved_analytics_report")
      expect(event.properties).to include(
        "type" => "analytics_report",
        "report_id" => own_report.id,
        "report_type" => "revenue_forecast",
        "company_id" => company.id,
        "user_id" => creator.id
      )
    end
  end

  describe "DELETE /internal_api/v1/analytics/reports/:id" do
    it "allows creator to delete the saved report" do
      sign_in creator

      send_request :delete,
        "/internal_api/v1/analytics/reports/#{own_report.id}",
        headers: auth_headers(creator)

      expect(response).to have_http_status(:no_content)
      expect(AnalyticsReport.exists?(own_report.id)).to be(false)
    end

    it "prevents other workspace users from deleting the report" do
      sign_in viewer

      send_request :delete,
        "/internal_api/v1/analytics/reports/#{own_report.id}",
        headers: auth_headers(viewer)

      expect(response).to have_http_status(:not_found)
      expect(AnalyticsReport.exists?(own_report.id)).to be(true)
    end
  end
end
