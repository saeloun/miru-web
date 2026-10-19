# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tax-declaration browser workflow", type: :system, js: true do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }

  before do
    [admin, employee].each do |user|
      create(:employment, company:, user:, joined_at: "2026-01-01", resigned_at: nil)
    end
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
  end

  it "reviews private proof and preserves the approved original until its correction is approved" do
    sign_in(employee)
    with_forgery_protection do
      visit "/tax-declarations"
      click_button "Add declaration"
      fill_in "Claimed amount (INR)", with: "12000.50"
      fill_in "Claim details", with: "Investment statement"
      attach_file "Supporting documents", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
      click_button "Save draft"
      expect(page).to have_button("Submit for review")
      within("[role='dialog']") do
        expect(page).to have_content("Draft")
        expect(page).to have_button("Download · pdf-file.pdf")
        click_button "Submit for review"
        expect(page).to have_content("Submitted")
        expect(page).not_to have_button("Save review")
        click_button "Close"
      end

      sign_in(admin)
      visit "/tax-declarations"
      find("button", text: /\AView declaration #\d+\z/).click
      within("[role='dialog']") do
        expect(page).not_to have_button("Withdraw declaration")
        expect(page).not_to have_button("Create correction")
        fill_in "Reviewed amount (INR)", with: "10000.25"
        fill_in "Review reason", with: "Reviewed original proof"
        click_button "Save review"
        expect(page).to have_content("Approved")
        expect(page).not_to have_button("Save review")
        expect(page).to have_css("dd", text: "₹10,000.25", exact_text: true)
      end

      sign_in(employee)
      visit "/tax-declarations"
      find("button", text: /\AView declaration #\d+\z/).click
      click_button "Create correction"
      expect(page).to have_checked_field("Keep the 1 previous document(s)")
      fill_in "Claimed amount (INR)", with: "13000.50"
      fill_in "Claim details", with: "Corrected investment details; original proof retained"
      click_button "Save draft"
      expect(page).to have_button("Submit for review")
      within("[role='dialog']") do
        expect(page).to have_button("Download · pdf-file.pdf")
        click_button "Submit for review"
        expect(page).to have_content("Submitted")
        click_button "Previous version"
        expect(page).to have_content("Approved")
        expect(page).to have_content("Reviewed original proof")
      end

      sign_in(admin)
      visit "/tax-declarations"
      within(find("tbody tr", text: "₹13,000.50")) { find("button", text: /\AView declaration #\d+\z/).click }
      within("[role='dialog']") do
        fill_in "Reviewed amount (INR)", with: "12000.25"
        fill_in "Review reason", with: "Reviewed corrected details"
        click_button "Save review"
        expect(page).to have_content("Approved")
        expect(page).not_to have_button("Save review")
        expect(page).to have_css("dd", text: "₹12,000.25", exact_text: true)
        click_button "Previous version"
        expect(page).to have_content("Withdrawn")
        expect(page).to have_content("Reviewed original proof")
        expect(page).to have_css("dd", text: "₹10,000.25", exact_text: true)
        expect(page).to have_button("Download · pdf-file.pdf")
        click_button "Next version"
        expect(page).to have_content("Approved")
        expect(page).to have_content("Reviewed corrected details")
      end
    end
  end
end
