# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - day view", type: :system, js: true do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      create(:timesheet_entry, user: admin, project:)
      sign_in(admin)
    end

    it "can view the time sheet entry", :pending do
      time_entry = create(:timesheet_entry, user: admin, project:)

      with_forgery_protection do
        visit "time-tracking"
        click_button "DAY"

        expect(page).to have_content(time_entry.note)
      end
    end

    it "can add time entry", :pending do
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        click_button "NEW ENTRY"
        select client.name, from: "client"
        fill_in "notes", with: "Testing note!"
        fill_in "timeInput", with: "8"
        click_button "SAVE"
        sleep 1

        expect(page).to have_content(admin.timesheet_entries.first.note)
      end
    end

    it "can edit time entry", :pending do
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        el = find('button[aria-label*="edit"], button:has(svg[data-icon="pencil"]), .edit-button', match: :first).hover
        el.click
        fill_in "notes", with: "Testing note!"
        click_button "UPDATE"

        expect(page).to have_content("Testing note!")
      end
    end

    it "can delete time entry", :pending do
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        el = find('button[aria-label*="delete"], button:has(svg[data-icon="trash"]), .delete-button', match: :first).hover
        el.click
        sleep 1

        expect(admin.timesheet_entries.size).to eq(0)
      end
    end

    it "can view other users entry", :pending do
      user_two = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: user_two)
      create(:project_member, user: user_two, project:)
      time_entry = create(:timesheet_entry, user: user_two, project:)

      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"

        # Click the user dropdown in the top right
        find('[data-testid="user-select"], [role="combobox"]', match: :first).click
        # Select the user from dropdown options
        find('[role="option"]', text: user_two.full_name).click

        expect(page).to have_content(time_entry.note)
      end
    end
  end

  context "when user is employee" do
    before do
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      sign_in(employee)
    end

    it "can view the time sheet entry", :pending do
      time_entry = create(:timesheet_entry, user: employee, project:)
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"

        expect(page).to have_content(time_entry.note)
      end
    end

    it "can add time entry", :pending do
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        click_button "NEW ENTRY"
        select client.name, from: "client"
        fill_in "notes", with: "Testing note!"
        fill_in "timeInput", with: "8"
        click_button "SAVE"

        expect(page).to have_content("Testing note!")
      end
    end

    it "can edit time entry", :pending do
      create(:timesheet_entry, user: employee, project:)
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        el = find('button[aria-label*="edit"], button:has(svg[data-icon="pencil"]), .edit-button', match: :first).hover
        el.click
        fill_in "notes", with: "Testing note!"
        click_button "UPDATE"

        expect(page).to have_content("Testing note!")
      end
    end

    it "can delete time entry", :pending do
      create(:timesheet_entry, user: employee, project:)
      with_forgery_protection do
        visit "time-tracking"

        click_button "DAY"
        el = find('button[aria-label*="delete"], button:has(svg[data-icon="trash"]), .delete-button', match: :first).hover
        el.click
        sleep 1

        expect(employee.timesheet_entries.size).to eq(0)
      end
    end
  end
end
