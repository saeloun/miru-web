# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Analytics", type: :system, js: true do
  let!(:company) do
    create(
      :company,
      base_currency: "USD",
      name: "Analytics Corp",
      plan_tier: "paid",
      subscription_status: "active",
      working_days: "5",
      working_hours: "40"
    )
  end
  let!(:admin) { create(:user, current_workspace: company) }
  let!(:employee) { create(:user, current_workspace: company) }
  let!(:client_alpha) { create(:client, company:, name: "Client Alpha") }
  let!(:client_beta) { create(:client, company:, name: "Client Beta") }
  let!(:project_alpha) { create(:project, client: client_alpha, name: "Project Alpha", billable: true) }
  let!(:project_beta) { create(:project, client: client_beta, name: "Project Beta", billable: true) }
  let!(:travel_category) { create(:expense_category, company:, name: "Travel") }

  before do
    create(:employment, company:, user: admin, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    create(:employment, company:, user: employee, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    admin.add_role :admin, company
    employee.add_role :employee, company

    travel_to Time.zone.local(2026, 4, 18, 12, 0, 0)

    create(
      :timesheet_entry,
      user: admin,
      project: project_alpha,
      duration: 240,
      work_date: Date.new(2026, 4, 7),
      bill_status: :unbilled
    )
    create(
      :timesheet_entry,
      user: employee,
      project: project_beta,
      duration: 180,
      work_date: Date.new(2026, 4, 8),
      bill_status: :unbilled
    )
  end

  after { travel_back }

  def expect_analytics_shell(title)
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_content(title, wait: 10)
    expect(page).to have_no_content("Unable to load", wait: 2)
  end

  context "when signed in as an admin" do
    before { sign_in(admin) }

    it "loads the analytics dashboard with full financial summaries" do
      with_forgery_protection do
        visit "/analytics?preset=custom&from=2026-04-01&to=2026-04-18"

        expect_analytics_shell("Analytics")
        expect(page).to have_content("Team utilization", wait: 10)
        expect(page).to have_content("Total revenue", wait: 10)
        expect(page).to have_content("Highlights", wait: 10)
        expect(page).to have_no_content("Restricted for employees")
      end
    end

    it "loads all analytics routes" do
      with_forgery_protection do
        visit "/analytics/revenue-forecast"
        expect_analytics_shell("Revenue Forecast")

        visit "/analytics/team"
        expect_analytics_shell("Team Analytics")
        expect(page).to have_content("Team members", wait: 10)

        visit "/analytics/clients"
        expect_analytics_shell("Client Insights")

        visit "/analytics/expenses"
        expect_analytics_shell("Expense Trends")
      end
    end

    it "restores shared filter query params after reload on analytics pages" do
      with_forgery_protection do
        visit "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18&members=#{admin.id}"

        expect_analytics_shell("Team Analytics")
        expect(page).to have_content(admin.full_name, wait: 10)
        expect(page).to have_no_content(employee.full_name)

        page.refresh

        expect(page).to have_current_path(
          "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18&members=#{admin.id}",
          wait: 10
        )
        expect(page).to have_content(admin.full_name, wait: 10)
        expect(page).to have_no_content(employee.full_name)

        visit "/analytics/clients?preset=custom&from=2026-04-01&to=2026-04-18&clients=#{client_alpha.id}"
        expect_analytics_shell("Client Insights")

        page.refresh

        expect(page).to have_current_path(
          "/analytics/clients?preset=custom&from=2026-04-01&to=2026-04-18&clients=#{client_alpha.id}",
          wait: 10
        )

        visit "/analytics/expenses?preset=custom&from=2026-04-01&to=2026-04-18&projects=#{project_alpha.id}"
        expect_analytics_shell("Expense Trends")

        page.refresh

        expect(page).to have_current_path(
          "/analytics/expenses?preset=custom&from=2026-04-01&to=2026-04-18&projects=#{project_alpha.id}",
          wait: 10
        )
      end
    end
  end

  context "when signed in as an employee" do
    before { sign_in(employee) }

    it "shows team analytics but restricts financial analytics pages" do
      with_forgery_protection do
        visit "/analytics?preset=custom&from=2026-04-01&to=2026-04-18"

        expect_analytics_shell("Analytics")
        expect(page).to have_content("Team utilization", wait: 10)
        expect(page).to have_content("Restricted for employees", wait: 10)
        expect(page).to have_content("Financial highlights are restricted", wait: 10)
        expect(page).to have_no_content("Total revenue")

        visit "/analytics/revenue-forecast"
        expect_analytics_shell("Revenue Forecast")
        expect(page).to have_content("Revenue forecast is restricted", wait: 10)

        visit "/analytics/clients"
        expect_analytics_shell("Client Insights")
        expect(page).to have_content("Client insights are restricted", wait: 10)

        visit "/analytics/expenses"
        expect_analytics_shell("Expense Trends")
        expect(page).to have_content("Expense trends are restricted", wait: 10)
      end
    end

    it "keeps team analytics scoped after reload" do
      with_forgery_protection do
        visit "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18"

        expect_analytics_shell("Team Analytics")
        expect(page).to have_content(employee.full_name, wait: 10)
        expect(page).to have_no_content(admin.full_name)

        page.refresh

        expect(page).to have_current_path(
          "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18",
          wait: 10
        )
        expect(page).to have_content(employee.full_name, wait: 10)
        expect(page).to have_no_content(admin.full_name)
      end
    end
  end
end
