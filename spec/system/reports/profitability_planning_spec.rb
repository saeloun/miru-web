# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Profitability planning", type: :system do
  it "previews edits, saves a baseline, adds overhead and reloads the adjusted scenario" do
    company = create(:company, plan_tier: "paid")
    user = create(:user, confirmed_at: Time.current, current_workspace: company)
    user.add_role(:owner, company)
    create(:employment, user:, company:, joined_at: Date.current, resigned_at: nil)
    with_forgery_protection do
      sign_in user
      visit "/reports/profitability-planning/new?currency=USD"
      expect(page).to have_content("Profitability Planning")
      fill_in "Plan name", with: "Hiring scenario"
      within("[data-person-row]") do
        fill_in "Monthly capacity hours", with: "160"
        fill_in "Target utilization %", with: "80"
        fill_in "Hourly billing rate", with: "50"
        fill_in "Monthly compensation", with: "3000"
      end
      click_on "Add overhead"
      fill_in "Overhead name", with: "Software"
      fill_in "Monthly amount (USD)", with: "500"
      fill_in "Opening available cash", with: "10000"
      fill_in "Expected monthly cash collections", with: "4000"
      expect(page).to have_css('[data-summary="revenue"]', text: "USD 6,400.00")
      expect(page).to have_css('[data-summary="margin"]', text: "USD 2,900.00")
      page.execute_script("document.querySelector('#planning-form').addEventListener('submit', event => event.preventDefault(), { once: true })")
      click_on "Save plan"
      expect(page).to have_button("Save plan", disabled: true)
      page.execute_script("window.dispatchEvent(new Event('pageshow'))")
      expect(page).to have_button("Save plan", disabled: false)
      click_on "Save plan"
      expect(page).to have_content("First saved baseline")
      expect(page).to have_css('[data-summary="revenue"]', text: "USD 6,400.00")
      within("[data-person-row]") { fill_in "Hourly billing rate", with: "60" }
      expect(page).to have_css('[data-summary="revenue"]', text: "USD 7,680.00")
      expect(page).to have_content("USD 6,400.00")
      click_on "Save plan"
      visit current_path
      expect(page).to have_field("Hourly billing rate", with: "60")
      expect(page).to have_css('[data-summary="margin"]', text: "USD 4,180.00")
      expect(page).to have_link("Export saved plan CSV")
      fill_in "Target utilization %", with: "101"
      expect(page).to have_css("#planning-error", text: "between 0 and 100")
      expect(page).to have_css('[data-summary="revenue"]', text: "N/A")
      fill_in "Target utilization %", with: "80"
      expect(page).to have_css('[data-summary="revenue"]', text: "USD 7,680.00")
      page.save_screenshot(Rails.root.join("tmp", "profitability-planning-verified.png"))
      click_on "Add person or planned hire"
      expect(page).to have_css("[data-person-row]", count: 2)
      within(all("[data-person-row]").last) { click_on "Remove" }
      expect(page).to have_css("[data-person-row]", count: 1)
    end
  end
end
