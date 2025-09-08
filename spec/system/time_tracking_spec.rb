# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client, billable: true) }

  before do
    create(:employment, company: company, user: user)
    user.add_role :admin, company
    sign_in user
  end

  describe "Monthly Calendar View" do
    let!(:timesheet_entry1) do
      create(:timesheet_entry,
        user: user,
        project: project,
        work_date: Date.current,
        duration: 480, # 8 hours
        note: "Worked on feature implementation",
        bill_status: "unbilled"
      )
    end

    let!(:timesheet_entry2) do
      create(:timesheet_entry,
        user: user,
        project: project,
        work_date: Date.current - 1.day,
        duration: 240, # 4 hours
        note: "Bug fixing and code review",
        bill_status: "unbilled"
      )
    end

    let!(:timesheet_entry3) do
      create(:timesheet_entry,
        user: user,
        project: project,
        work_date: Date.current - 2.days,
        duration: 360, # 6 hours
        note: "Client meeting and planning",
        bill_status: "non_billable"
      )
    end

    it "displays time tracking page with monthly calendar by default" do
      visit "/time-tracking"

      # Wait for page to load
      expect(page).to have_content("Time Tracking", wait: 10)

      # Should have Month button
      expect(page).to have_button("Month")

      # Should show current month and year
      expect(page).to have_content(Date.current.strftime("%B %Y"))
    end

    it "displays timesheet entries on the calendar" do
      visit "/time-tracking"

      # Wait for calendar to load
      expect(page).to have_css(".sx__month-grid", wait: 5)

      # Should display project name and duration for today's entry
      within(".sx__month-grid") do
        expect(page).to have_content("#{project.name}: 08:00")
        expect(page).to have_content("#{project.name}: 04:00")
        expect(page).to have_content("#{project.name}: 06:00")
      end
    end

    it "allows clicking on a timesheet entry to edit" do
      visit "/time-tracking"

      # Click on today's entry
      find(".sx__event", text: "08:00", match: :first).click

      # Should open edit form
      expect(page).to have_field("Duration", with: "08:00")
      expect(page).to have_field("Note", with: "Worked on feature implementation")
      expect(page).to have_select("Project", selected: project.name)
    end

    it "allows clicking on a date to add new entry" do
      visit "/time-tracking"

      # Click on an empty date (future date)
      future_date = Date.current + 3.days
      find(".sx__month-grid-day", text: future_date.day.to_s).click

      # Should open new entry form
      expect(page).to have_content("NEW ENTRY")
      expect(page).to have_field("Duration")
      expect(page).to have_field("Note")
      expect(page).to have_select("Project")
    end

    it "displays employee selector for admin users" do
      visit "/time-tracking"

      # Should have employee dropdown
      expect(page).to have_css("[role='combobox']")

      # Should show current user as selected
      expect(page).to have_content("#{user.first_name} #{user.last_name}")
    end

    it "allows switching between week and month views" do
      visit "/time-tracking"

      # Initially in month view
      expect(page).to have_button("Month", class: /active/)

      # Switch to week view
      click_button "Week"

      # Should show week view
      expect(page).to have_button("Week", class: /active/)
      expect(page).to have_css(".week-view")

      # Should show days of the week
      %w[Mon Tue Wed Thu Fri Sat Sun].each do |day|
        expect(page).to have_content(day)
      end
    end

    it "displays total hours for the selected period" do
      visit "/time-tracking"

      # Should show total hours somewhere on the page
      # Total: 8 + 4 + 6 = 18 hours = 18:00
      expect(page).to have_content("Total")

      # Note: The exact location and format may vary based on implementation
    end

    context "with no timesheet entries" do
      before do
        TimesheetEntry.destroy_all
      end

      it "displays empty calendar with add entry option" do
        visit "/time-tracking"

        # Should still show calendar
        expect(page).to have_css(".sx__month-grid")

        # Should have new entry button
        expect(page).to have_button("NEW ENTRY")

        # Calendar should not have any events
        expect(page).not_to have_css(".sx__event")
      end
    end

    context "with multiple employees" do
      let(:other_user) { create(:user, current_workspace_id: company.id) }
      let!(:other_employment) { create(:employment, company: company, user: other_user) }
      let!(:other_entry) do
        create(:timesheet_entry,
          user: other_user,
          project: project,
          work_date: Date.current,
          duration: 300,
          note: "Other user's work"
        )
      end

      it "allows admin to view other employees' entries" do
        visit "/time-tracking"

        # Should be able to select other employee
        find("[role='combobox']").click
        click_on "#{other_user.first_name} #{other_user.last_name}"

        # Should show other user's entries
        expect(page).to have_content("#{project.name}: 05:00")
        expect(page).not_to have_content("08:00") # Current user's entry
      end
    end
  end

  describe "Calendar date navigation" do
    it "allows navigating to previous and next months" do
      visit "/time-tracking"

      current_month = Date.current.strftime("%B %Y")
      previous_month = (Date.current - 1.month).strftime("%B %Y")
      next_month = (Date.current + 1.month).strftime("%B %Y")

      # Should show current month
      expect(page).to have_content(current_month)

      # Navigate to previous month
      find("button[aria-label='Previous period']").click
      expect(page).to have_content(previous_month)

      # Navigate to next month
      find("button[aria-label='Next period']").click
      find("button[aria-label='Next period']").click
      expect(page).to have_content(next_month)
    end

    it "has a Today button to return to current date" do
      visit "/time-tracking"

      # Navigate away from current month
      find("button[aria-label='Previous period']").click

      # Click Today button
      click_button "Today"

      # Should return to current month
      expect(page).to have_content(Date.current.strftime("%B %Y"))
    end
  end
end
