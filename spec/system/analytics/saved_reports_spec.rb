# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Analytics saved reports", type: :system, js: true do
  let(:company) do
    create(:company, base_currency: "USD", plan_tier: "paid", subscription_status: "active", working_days: "5", working_hours: "40")
  end
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company:, name: "Saved Report Client") }
  let(:project) { create(:project, client:, billable: true, name: "Saved Report Project") }

  before do
    create(:employment, company:, user: admin, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    create(:employment, company:, user: employee, joined_at: Date.new(2026, 1, 1), resigned_at: nil)
    admin.add_role :admin, company
    employee.add_role :employee, company
    travel_to Time.zone.local(2026, 4, 18, 12, 0, 0)
    create(:timesheet_entry, user: admin, project:, duration: 240, work_date: Date.new(2026, 4, 7), bill_status: :unbilled)
  end

  after { travel_back }

  it "saves, opens, deletes reports and shows export actions" do
    sign_in(admin)

    with_forgery_protection do
      visit "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18"

      expect(page).to have_content("Export CSV", wait: 10)
      expect(page).to have_content("Export PDF", wait: 10)

      click_button "Save Report"
      fill_in "Enter report name", with: "My saved team view"
      click_button "Save"

      expect(page).to have_content("My saved team view", wait: 10)

      click_button "Open", match: :first
      expect(page).to have_current_path("/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18", wait: 10)

      click_button "Delete", match: :first
      expect(page).to have_no_content("My saved team view", wait: 10)
    end
  end

  it "does not offer delete to non-creators" do
    create(:analytics_report, company:, creator: admin, report_type: :team_productivity, name: "Shared team report", filters: { "preset" => "custom", "from" => "2026-04-01", "to" => "2026-04-18" })
    sign_in(employee)

    with_forgery_protection do
      visit "/analytics/team?preset=custom&from=2026-04-01&to=2026-04-18"

      expect(page).to have_content("Shared team report", wait: 10)
      expect(page).to have_no_content("Delete")
    end
  end
end
