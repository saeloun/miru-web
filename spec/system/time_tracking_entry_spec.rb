# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking Entry", type: :system, js: true do
  let(:user) { create(:user, email: "test@example.com", password: "password123") }
  let(:company) { create(:company) }
  let(:employment) { create(:employment, user: user, company: company) }
  let(:client) { create(:client, company: company, name: "Test Client") }
  let(:project) { create(:project, client: client, name: "Test Project", billable: true) }

  before do
    employment
    project
    sign_in user
  end

  describe "Adding time entry with duration and description" do
    it "saves and displays entry with duration and description in weekly view" do
      # Navigate to time tracking
      visit "/time-tracking"
      expect(page).to have_content("Time Tracking")

      # Should default to week view
      expect(page).to have_button("Week", class: /bg-primary|bg-indigo/)

      # Click Add button
      find("button", text: /Add/i).click

      # Wait for form to appear
      expect(page).to have_text("Duration", wait: 5)
      expect(page).to have_text("Description")

      # Select client
      within("div", text: "Client") do
        find("button[role='combobox']").click
      end
      find("[role='option']", text: "Test Client").click

      # Select project
      within("div", text: "Project") do
        find("button[role='combobox']").click
      end
      find("[role='option']", text: "Test Project").click

      # Fill in duration
      hours_input = find("input[type='number'][placeholder='0']", match: :first)
      hours_input.fill_in with: "2"

      minutes_input = all("input[type='number'][placeholder='0']")[1]
      minutes_input.fill_in with: "30"

      # Fill in description
      description = "Working on time tracking feature improvements"
      fill_in placeholder: "What did you work on?", with: description

      # Save the entry
      click_button "Add Entry"

      # Wait for entry to be saved
      expect(page).to have_content("02:30", wait: 10)

      # Verify the entry appears in weekly view
      expect(page).to have_button("02:30")

      # Click on the entry to see description
      find("button", text: "02:30").click

      # Verify description appears
      expect(page).to have_field(type: "textarea", with: description)

      # Take screenshot for verification
      page.save_screenshot("time_tracking_weekly_with_entry.png")
    end

    it "displays saved entry correctly in monthly view" do
      # First create an entry
      create(:timesheet_entry,
        user: user,
        project: project,
        duration: 150, # 2 hours 30 minutes in minutes
        note: "Test entry for monthly view",
        work_date: Date.current,
        bill_status: "non_billable"
      )

      # Navigate to time tracking
      visit "/time-tracking"

      # Switch to month view
      click_button "Month"
      expect(page).to have_button("Month", class: /bg-primary|bg-indigo/)

      # Verify the entry shows in the calendar
      # Should show 02:30 for today's date
      within(".grid") do
        expect(page).to have_content("02:30")
      end

      # Click on today's date
      today_button = find("button", text: Date.current.day.to_s)
      today_button.click

      # Should show entry details or switch to day view
      expect(page).to have_content("Test entry for monthly view")

      # Take screenshot
      page.save_screenshot("time_tracking_monthly_with_entry.png")
    end

    it "validates that duration is required" do
      visit "/time-tracking"

      # Click Add button
      find("button", text: /Add/i).click

      # Select client
      within("div", text: "Client") do
        find("button[role='combobox']").click
      end
      find("[role='option']", text: "Test Client").click

      # Select project
      within("div", text: "Project") do
        find("button[role='combobox']").click
      end
      find("[role='option']", text: "Test Project").click

      # Don't fill duration, only description
      fill_in placeholder: "What did you work on?", with: "Test description"

      # Add Entry button should be disabled
      add_button = find("button", text: "Add Entry")
      expect(add_button).to be_disabled

      # Now add duration
      hours_input = find("input[type='number'][placeholder='0']", match: :first)
      hours_input.fill_in with: "1"

      # Button should now be enabled
      expect(add_button).not_to be_disabled
    end

    it "allows editing existing entry's duration and description" do
      # Create an existing entry
      create(:timesheet_entry,
        user: user,
        project: project,
        duration: 60, # 1 hour
        note: "Original description",
        work_date: Date.current,
        bill_status: "non_billable"
      )

      visit "/time-tracking"

      # Click on the existing entry
      find("button", text: "01:00").click

      # Edit the duration
      time_input = find("input[value='01:00']")
      time_input.fill_in with: "02:15"

      # Edit the description
      textarea = find("textarea", text: "Original description")
      textarea.fill_in with: "Updated description with more details"

      # Save changes
      click_button "Update"

      # Verify updated duration shows
      expect(page).to have_button("02:15")

      # Click again to verify description was saved
      find("button", text: "02:15").click
      expect(page).to have_field(type: "textarea", with: "Updated description with more details")
    end
  end
end
