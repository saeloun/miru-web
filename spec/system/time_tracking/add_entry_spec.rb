# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - Add Entry", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  before do
    create(:employment, user:, company:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  describe "Adding time entries" do
    context "in week view" do
      before do
        visit "/time-tracking"
        # Ensure we're in week view (default)
        expect(page).to have_css("[data-view='week']", wait: 5)
      end

      it "allows adding a new entry for today" do
        # Click Add Entry button
        click_button "Add Entry"

        # Fill in the entry form
        within ".weekly-entries" do
          # Select project
          find(".project-select").click
          select project.name, from: find(".project-select")

          # Add hours for today (current day)
          today_index = Date.today.wday == 0 ? 6 : Date.today.wday - 1 # Adjust for Monday start
          hour_inputs = all("input[type='number']")
          hour_inputs[today_index].fill_in with: "3.5"

          # Add note
          find("textarea").fill_in with: "Working on time tracking feature"

          # Save the entry
          click_button "Save"
        end

        # Verify entry appears in week view
        expect(page).to have_content("3:30", wait: 5)
        expect(page).to have_content(project.name)

        # Verify weekly total is updated
        within ".weekly-total" do
          expect(page).to have_content("3:30")
        end
      end

      it "shows newly added entries when clicking on a day" do
        # First add an entry
        click_button "Add Entry"

        within ".weekly-entries" do
          find(".project-select").click
          select project.name, from: find(".project-select")

          today_index = Date.today.wday == 0 ? 6 : Date.today.wday - 1
          hour_inputs = all("input[type='number']")
          hour_inputs[today_index].fill_in with: "2.5"

          find("textarea").fill_in with: "Test entry for modal"
          click_button "Save"
        end

        # Click on today's date to open modal
        today_button = find(".dates-in-week button", text: Date.today.day, match: :first)
        today_button.click

        # Verify modal opens with the entry
        within("[role='dialog']") do
          expect(page).to have_content("Test entry for modal")
          expect(page).to have_content(project.name)
          expect(page).to have_content("2:30")
          expect(page).to have_content(Date.today.strftime("%A, %B %-d, %Y"))
        end
      end
    end

    context "in month view" do
      before do
        visit "/time-tracking"
        # Switch to month view
        click_button "Month"
        expect(page).to have_css("[data-view='month']", wait: 5)
      end

      it "allows adding a new entry for today via modal" do
        # Click on today's date in the calendar
        today_cell = find(".month-calendar button", text: Date.today.day, match: :first)
        today_cell.click

        # Modal should open
        within("[role='dialog']") do
          expect(page).to have_content(Date.today.strftime("%A, %B %-d, %Y"))

          # Click Add Entry button in modal
          click_button "Add Entry"

          # Fill in the entry form
          within ".entry-form" do
            find(".project-select").click
            select project.name, from: find(".project-select")

            find("input[name='duration']").fill_in with: "4.25"
            find("textarea[name='note']").fill_in with: "Monthly view entry test"

            click_button "Save"
          end

          # Verify entry appears in modal
          expect(page).to have_content("Monthly view entry test")
          expect(page).to have_content(project.name)
          expect(page).to have_content("4:15")
          expect(page).to have_content("Total: 4:15")
        end

        # Close modal
        find("[aria-label='Close']").click

        # Verify entry hours appear on calendar cell
        within today_cell do
          expect(page).to have_content("4:15")
        end
      end

      it "displays total hours on calendar after adding multiple entries" do
        # Add first entry
        today_cell = find(".month-calendar button", text: Date.today.day, match: :first)
        today_cell.click

        within("[role='dialog']") do
          click_button "Add Entry"

          within ".entry-form" do
            find(".project-select").click
            select project.name, from: find(".project-select")
            find("input[name='duration']").fill_in with: "2"
            find("textarea[name='note']").fill_in with: "First entry"
            click_button "Save"
          end

          # Add second entry
          click_button "Add Entry"

          within ".entry-form" do
            find(".project-select").click
            select project.name, from: find(".project-select")
            find("input[name='duration']").fill_in with: "3"
            find("textarea[name='note']").fill_in with: "Second entry"
            click_button "Save"
          end

          # Verify total in modal
          expect(page).to have_content("Total: 5:00")
          expect(page).to have_content("First entry")
          expect(page).to have_content("Second entry")
        end

        # Close modal
        find("[aria-label='Close']").click

        # Verify total hours on calendar
        within today_cell do
          expect(page).to have_content("5:00")
        end

        # Verify weekly total is updated
        week_row = today_cell.ancestor(".week-row")
        within week_row.find(".week-total") do
          expect(page).to have_content("5:00")
        end
      end
    end

    context "switching between views" do
      it "shows the same entries in both week and month views" do
        # Add entry in week view
        visit "/time-tracking"
        click_button "Add Entry"

        within ".weekly-entries" do
          find(".project-select").click
          select project.name, from: find(".project-select")

          today_index = Date.today.wday == 0 ? 6 : Date.today.wday - 1
          hour_inputs = all("input[type='number']")
          hour_inputs[today_index].fill_in with: "6.75"

          find("textarea").fill_in with: "Cross-view test entry"
          click_button "Save"
        end

        # Verify in week view
        expect(page).to have_content("6:45")
        expect(page).to have_content(project.name)

        # Switch to month view
        click_button "Month"
        expect(page).to have_css("[data-view='month']", wait: 5)

        # Find today's cell and verify hours are displayed
        today_cell = find(".month-calendar button", text: Date.today.day, match: :first)
        within today_cell do
          expect(page).to have_content("6:45")
        end

        # Click to open modal and verify entry details
        today_cell.click

        within("[role='dialog']") do
          expect(page).to have_content("Cross-view test entry")
          expect(page).to have_content(project.name)
          expect(page).to have_content("6:45")
          expect(page).to have_content("Total: 6:45")
        end

        # Close modal and switch back to week view
        find("[aria-label='Close']").click
        click_button "Week"
        expect(page).to have_css("[data-view='week']", wait: 5)

        # Verify entry still shows in week view
        expect(page).to have_content("6:45")
        expect(page).to have_content(project.name)
      end
    end
  end

  describe "Entry validation" do
    it "shows error when trying to save entry without required fields" do
      visit "/time-tracking"
      click_button "Add Entry"

      within ".weekly-entries" do
        # Try to save without selecting project or entering hours
        click_button "Save"

        # Should show validation error
        expect(page).to have_content("Project is required")
        expect(page).to have_content("Please enter hours for at least one day")
      end
    end

    it "prevents adding negative hours" do
      visit "/time-tracking"
      click_button "Add Entry"

      within ".weekly-entries" do
        find(".project-select").click
        select project.name, from: find(".project-select")

        today_index = Date.today.wday == 0 ? 6 : Date.today.wday - 1
        hour_inputs = all("input[type='number']")
        hour_inputs[today_index].fill_in with: "-2"

        click_button "Save"

        expect(page).to have_content("Hours must be positive")
      end
    end
  end
end
