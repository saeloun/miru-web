# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::AnalyticsExportsController", type: :request do
  let(:company) { create(:company, base_currency: "USD", working_days: "5", working_hours: "40") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }
  let(:expense_category) { create(:expense_category, company:, name: "Travel") }

  before do
    create(:employment, company:, user: admin, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    create(:employment, company:, user: employee, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    admin.add_role :admin, company
    employee.add_role :employee, company

    paid_invoice = create(:invoice, company:, client:, issue_date: Date.new(2026, 4, 5), due_date: Date.new(2026, 4, 25), amount: 300, amount_due: 0, amount_paid: 300, base_currency_amount: 300, status: :paid)
    create(:payment, invoice: paid_invoice, amount: 300, base_currency_amount: 300, transaction_date: Date.new(2026, 4, 10), status: :paid, transaction_type: :bank_transfer)

    admin_entry = create(:timesheet_entry, user: admin, project:, duration: 240, work_date: Date.new(2026, 4, 7), bill_status: :unbilled)
    employee_entry = create(:timesheet_entry, user: employee, project:, duration: 180, work_date: Date.new(2026, 4, 8), bill_status: :unbilled)
    create(:invoice_line_item, invoice: paid_invoice, timesheet_entry: admin_entry, quantity: 240, rate: 75, date: Date.new(2026, 4, 7))
    create(:invoice_line_item, invoice: paid_invoice, timesheet_entry: employee_entry, quantity: 180, rate: 50, date: Date.new(2026, 4, 8))
    create(:expense, company:, project:, expense_category:, category_name: nil, date: Date.new(2026, 4, 8), amount: 125)
  end

  shared_examples "analytics export success" do |path, expected_content_type, expected_body_fragment|
    it "downloads export data" do
      send_request :get, path, headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include(expected_content_type)
      expect(response.headers["Content-Disposition"]).to include("attachment")
      if expected_content_type != "application/pdf" && expected_body_fragment.present?
        expect(response.body).to include(expected_body_fragment)
      end
    end
  end

  context "when signed in as admin" do
    before { sign_in admin }

    include_examples "analytics export success", "/internal_api/v1/analytics/exports/revenue_forecast.csv?horizon=6", "text/csv", "Forecast data"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/revenue_forecast.pdf?horizon=6", "application/pdf", "%PDF"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/team_productivity.csv?from=2026-04-01&to=2026-04-18", "text/csv", "Team members"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/team_productivity.pdf?from=2026-04-01&to=2026-04-18", "application/pdf", "%PDF"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/client_analysis.csv?from=2026-04-01&to=2026-04-18", "text/csv", "Clients"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/client_analysis.pdf?from=2026-04-01&to=2026-04-18", "application/pdf", "%PDF"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/expense_trends.csv?from=2026-04-01&to=2026-04-18", "text/csv", "Category trends"
    include_examples "analytics export success", "/internal_api/v1/analytics/exports/expense_trends.pdf?from=2026-04-01&to=2026-04-18", "application/pdf", "%PDF"
  end

  context "when signed in as employee" do
    before { sign_in employee }

    it "allows team export but scopes data to self" do
      send_request :get, "/internal_api/v1/analytics/exports/team_productivity.csv?from=2026-04-01&to=2026-04-18", headers: auth_headers(employee)

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(employee.full_name)
      expect(response.body).not_to include(admin.full_name)
    end

    it "forbids revenue forecast export" do
      send_request :get, "/internal_api/v1/analytics/exports/revenue_forecast.csv?horizon=6", headers: auth_headers(employee)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
