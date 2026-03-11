# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::DashboardController, type: :request do
  describe "GET /api/v1/dashboard" do
    let(:company) { create(:company) }
    let(:client_user) { create(:user, current_workspace_id: company.id) }
    let(:visible_client) { create(:client, company: company, name: "Visible Client") }
    let(:hidden_client) { create(:client, company: company, name: "Hidden Client") }
    let!(:visible_project) { create(:project, client: visible_client, billable: true) }
    let!(:hidden_project) { create(:project, client: hidden_client, billable: true) }
    let!(:visible_invoice) do
      create(:invoice, company: company, client: visible_client, amount: 1000, base_currency_amount: 1000, issue_date: Date.current - 1.month)
    end
    let!(:hidden_invoice) do
      create(:invoice, company: company, client: hidden_client, amount: 5000, base_currency_amount: 5000, issue_date: Date.current - 1.month)
    end
    let!(:visible_entry) do
      create(:timesheet_entry, project: visible_project, user: client_user, duration: 120, work_date: Date.current - 2.days)
    end
    let!(:hidden_entry) do
      create(:timesheet_entry, project: hidden_project, duration: 360, work_date: Date.current - 2.days)
    end

    before do
      client_user.add_role(:client, company)
      create(:client_member, company: company, client: visible_client, user: client_user)
      sign_in client_user
    end

    it "returns dashboard data scoped to the client's clients" do
      get "/api/v1/dashboard"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("stats", "total_revenue")).to eq("1000.0")
      expect(response.parsed_body.dig("stats", "active_projects")).to eq(1)
      expect(response.parsed_body.dig("stats", "billable_hours")).to eq(2.0)
      expect(response.parsed_body.dig("revenue_by_customer", 0, "name")).to eq("Visible Client")
      expect(response.parsed_body.fetch("revenue_by_customer").pluck("name")).not_to include("Hidden Client")
    end
  end
end
