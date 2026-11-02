# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employment editor server errors", type: :system, js: true do
  [1440, 375].each do |width|
    it "keeps history errors separate from Employee ID and saves a corrected draft at #{width}px" do
      company = create(:company)
      user = create(:user, current_workspace: company)
      employment = create(:employment, company:, user:, employee_id: "SI001", employment_type: "salaried",
        designation: "Developer", joined_at: Date.yesterday, resigned_at: nil)
      previous = create(:previous_employment, user:, company_name: "Synthetic History", role: "Developer")
      create(:employment, company:, employee_id: "reserved")
      user.add_role(:admin, company)
      console_errors = []

      with_forgery_protection do
        sign_in(user)
        page.current_window.resize_to(width, 1000)
        page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
        page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
        visit "/team/#{user.id}/employment/edit"
        expect(page).to have_field("employee_id", with: "SI001")
        fill_in "designation", with: "Retained draft"
        find("#company_name_0").set("")
        click_button "Update"

        expect(page).to have_css("p[role='alert']", text: "Company name can't be blank")
        expect(page).not_to have_css("#employee_id.border-destructive")
        expect(page).to have_field("designation", with: "Retained draft")
        expect(employment.reload.designation).to eq("Developer")
        expect(previous.reload.company_name).to eq("Synthetic History")
        page.save_screenshot(Rails.root.join("tmp/capybara/employment-history-error-#{width}.png"), full: true)

        find("#company_name_0").set("Corrected History")
        find("#role_0").set("")
        click_button "Update"
        expect(page).to have_css("p[role='alert']", text: "Role can't be blank")
        expect(page).not_to have_css("#employee_id.border-destructive")
        expect(page).not_to have_css("p[role='alert']", text: "Company name can't be blank")

        find("#role_0").set("Corrected role")
        fill_in "employee_id", with: "reserved"
        click_button "Update"
        expect(page).to have_css("#employee_id.border-destructive")
        expect(page).to have_content("Employee ID has already been taken")
        expect(page).not_to have_css("p[role='alert']")
        expect(page).to have_field("designation", with: "Retained draft")
        expect(previous.reload.company_name).to eq("Synthetic History")
        page.save_screenshot(Rails.root.join("tmp/capybara/employment-id-error-#{width}.png"), full: true)

        fill_in "employee_id", with: "SI070"
        click_button "Update"
        expect(page).to have_current_path("/team/#{user.id}/employment")
        expect(employment.reload).to have_attributes(employee_id: "SI070", designation: "Retained draft")
        expect(previous.reload).to have_attributes(company_name: "Corrected History", role: "Corrected role")
        expect(page).not_to have_content("Employee ID has already been taken")
        expect(console_errors).to be_empty
        page.save_screenshot(Rails.root.join("tmp/capybara/employment-corrected-#{width}.png"), full: true)
      end
    end
  end
end
