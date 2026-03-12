# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Dashboard#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_dashboard_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns dashboard data" do
      expect(json_response).to be_a(Hash)
    end
  end

  context "when user is an employee" do
    let(:visible_client) { create(:client, company: company, name: "Visible Client") }
    let!(:project) { create(:project, client: visible_client, billable: true) }
    let!(:invoice) do
      create(:invoice, company: company, client: visible_client, amount: 2500, base_currency_amount: 2500, issue_date: Date.current - 1.month)
    end
    let!(:entry) do
      create(:timesheet_entry, project: project, user: user, duration: 180, work_date: Date.current - 2.days)
    end

    before do
      create(:employment, company:, user:)
      create(:project_member, project: project, user: user, hourly_rate: 100)
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_dashboard_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "does not expose company revenue data" do
      expect(json_response.dig("stats", "total_revenue")).to eq(0)
      expect(json_response.dig("stats", "team_size")).to eq(1)
      expect(json_response.dig("stats", "active_projects")).to eq(1)
      expect(json_response.dig("stats", "billable_hours")).to eq(3.0)
      expect(json_response.fetch("revenue_chart")).to eq([])
      expect(json_response.fetch("revenue_by_customer")).to eq([])
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, api_v1_dashboard_index_path
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
