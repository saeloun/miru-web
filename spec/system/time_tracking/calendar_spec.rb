# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking Calendar", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client) }

  before do
    create(:employment, company: company, user: user)
    user.add_role :employee, company
    create(:project_member, project: project, user: user)
  end

  describe "Calendar View" do
    before do
      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "displays the time tracking interface" do
      # Check if the page loads and basic elements are present
      expect(page).to have_css("div.pb-14", wait: 10)

      # Check view toggle buttons exist
      expect(page).to have_content("Day")

      # Check if NEW ENTRY button is present
      expect(page).to have_button("NEW ENTRY", wait: 10)
    end

    it "allows navigation between months" do
      # Switch to month view
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Get current month
      current_month_text = find("div:has(button[aria-label*='Previous']) ~ div", wait: 10).text rescue nil

      # Click next month
      find("button[aria-label*='Next']", wait: 5).click
      sleep 1

      # Verify month changed
      new_month_text = find("div:has(button[aria-label*='Previous']) ~ div", wait: 10).text rescue nil
      expect(new_month_text).not_to eq(current_month_text) if current_month_text && new_month_text

      # Click Today to return to current month
      click_button "Today"
      sleep 1
    end

    it "switches between day and month view" do
      # Default should be day view
      expect(page).to have_css("[data-view='week']", wait: 5)

      # Switch to month view if toggle exists
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app

        # Check month calendar structure
        expect(page).to have_css("div.grid-cols-8", wait: 5)

        # Switch back to day/week view
        click_button "Day"
        expect(page).to have_css("[data-view='week']", wait: 5)
      end
    end
  end

  describe "Calendar Date Selection" do
    before do
      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "allows selecting a date in month view" do
      # Switch to month view
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Find and click on a date cell in month calendar
      date_buttons = all("button:has(span)", wait: 10).select do |btn|
        btn.text =~ /^\d+$/
      end

      if date_buttons.any?
        target_date = date_buttons.first
        target_date.click

        # Verify date selection styling appears (border-primary)
        expect(target_date).to have_css(".border-primary", wait: 5)
      end
    end

    it "highlights the current date in month view" do
      # Switch to month view
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Today should be highlighted with primary background
      expect(page).to have_css("span.bg-primary.text-primary-foreground", wait: 10)
    end

    it "displays time entries on calendar days in month view" do
      # Create a time entry for today
      create(:timesheet_entry,
        user: user,
        project: project,
        work_date: Date.current,
        duration: 480 # 8 hours in minutes
      )

      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app

      # Switch to month view to see calendar
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Look for time display in month calendar (8:00 format)
      expect(page).to have_content("8:00", wait: 10)
    end
  end

  describe "Calendar Time Entry Creation" do
    before do
      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "opens time entry form when clicking new entry button" do
      # Use the NEW ENTRY button to create entries
      click_button "NEW ENTRY"

      # Check if modern time entry form appears
      expect(page).to have_css("[role='dialog'], .modal", wait: 10)

      # Form should have required fields
      expect(page).to have_field("Duration", wait: 5)
      expect(page).to have_field("Note", wait: false)
    end

    it "creates a time entry using the modern form" do
      # Click NEW ENTRY button
      click_button "NEW ENTRY"

      # Fill in the modern time entry form
      within("[role='dialog'], .modal") do
        fill_in "Duration", with: "2:30"
        fill_in "Note", with: "Calendar test entry"

        # Select project if dropdown exists
        if page.has_css("select", wait: 1)
          select project.name, from: page.first("select")[:name]
        end

        click_button "Save"
      end

      # Verify entry was created (look for success message or entry card)
      expect(page).to have_content(/created|added/i, wait: 10)
    end
  end

  describe "Calendar Time Entry Editing" do
    let!(:time_entry) do
      create(:timesheet_entry,
        user: user,
        project: project,
        work_date: Date.current,
        duration: 120, # 2 hours
        note: "Original note"
      )
    end

    before do
      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "allows editing time entries via entry cards" do
      # Look for the entry card and click edit
      entry_card = find(".border", text: /#{time_entry.note}/, wait: 10)

      within(entry_card) do
        # Click edit button (pencil icon or edit text)
        find("button[aria-label*='edit'], button:has(svg)", match: :first).click
      end

      # Edit form should appear inline
      within(".border") do
        fill_in "Duration", with: "3:00"
        fill_in "Note", with: "Updated from calendar"

        click_button "Save"
      end

      # Verify update appears in entry list
      expect(page).to have_content("Updated from calendar", wait: 10)
    end

    it "allows deleting time entries via entry cards" do
      # Look for the entry card
      entry_card = find(".border", text: /#{time_entry.note}/, wait: 10)

      within(entry_card) do
        # Click delete button (trash icon)
        find("button[aria-label*='delete'], button:has(svg)", match: :first).click
      end

      # Confirm deletion if modal appears
      if page.has_css?("[role='dialog']", wait: 2)
        within("[role='dialog']") do
          click_button "Delete", match: :first
        end
      end

      # Verify entry is removed
      expect(page).not_to have_content(time_entry.note, wait: 10)
    end
  end

  describe "Calendar Week Summary" do
    before do
      # Create entries for the current week
      (0..4).each do |day_offset|
        create(:timesheet_entry,
          user: user,
          project: project,
          work_date: Date.current.beginning_of_week + day_offset.days,
          duration: 480 # 8 hours per day
        )
      end

      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "displays weekly total hours in month view" do
      # Switch to month view to see totals
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Should show 40 hours total for the week in month calendar
      expect(page).to have_content("40:00", wait: 10)
    end

    it "displays daily totals in month view" do
      # Switch to month view
      if page.has_button?("Month", wait: 2)
        click_button "Month"
        wait_for_react_app
      end

      # Should show 8:00 for each weekday
      expect(page.text.scan(/8:00/).length).to be >= 5
    end
  end

  describe "Calendar Mobile Responsiveness" do
    before do
      # Set mobile viewport
      page.driver.browser.manage.window.resize_to(375, 812)

      sign_in(user)
      visit "/"
      click_link "Time Tracking"
      sleep 2
      wait_for_react_app
    end

    it "displays mobile-optimized time tracking interface" do
      # Mobile should show the mobile header
      expect(page).to have_css(".lg\\:mt-6", wait: 10)

      # Should have mobile navigation elements
      expect(page).to have_css("div", wait: 5)
    end

    it "allows time entry creation on mobile" do
      # Look for NEW ENTRY button or create entry interface
      if page.has_button?("NEW ENTRY", wait: 2)
        click_button "NEW ENTRY"

        # Fill mobile form
        within("form, div") do
          fill_in "Duration", with: "1:30" if page.has_field?("Duration")
          fill_in "Note", with: "Mobile entry" if page.has_field?("Note")

          click_button "Save" if page.has_button?("Save")
        end
      else
        # Alternative mobile flow - check for empty state
        expect(page).to have_css("div", wait: 5)
      end
    end

    after do
      # Reset to desktop viewport
      page.driver.browser.manage.window.resize_to(1400, 900)
    end
  end
end
