# frozen_string_literal: true

require "rails_helper"

shared_examples_for "Time tracking" do |obj|
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    if obj[:is_admin] == true
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      login_as(admin)
    else
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      login_as(employee)
    end
  end

  it "can view the time sheet entry" do
    if obj[:is_admin] == true
      time_entry = create(:timesheet_entry, user: admin, project:)
    else
      time_entry = create(:timesheet_entry, user: employee, project:)
    end

    with_forgery_protection do
      visit "time-tracking"

      expect(page).to have_content(time_entry.note)
    end
  end

  it "can add time entry" do
    with_forgery_protection do
      visit "time-tracking"

      click_button "NEW ENTRY"
      select client.name, from: "client"
      fill_in "notes", with: "Testing note!"
      fill_in "timeInput", with: "8"
      click_button "SAVE"

      expect(page).to have_content("Timesheet created", wait: 3)
      if obj[:is_admin] == true
        expect(page).to have_content(admin.timesheet_entries.first.note)
      else
        expect(page).to have_content(employee.timesheet_entries.first.note)
      end
    end
  end

  it "can edit time entry" do
    if obj[:is_admin] == true
      create(:timesheet_entry, user: admin, project:)
    else
      create(:timesheet_entry, user: employee, project:)
    end

    with_forgery_protection do
      visit "time-tracking"

      el = find(:css, "#editIcon", visible: false).hover
      el.click
      fill_in "notes", with: "Testing note!"
      click_button "UPDATE"

      expect(page).to have_content("Timesheet updated", wait: 3)
      expect(page).to have_content("Testing note!")
    end
  end

  it "can delete time entry" do
    if obj[:is_admin] == true
      create(:timesheet_entry, user: admin, project:)
    else
      create(:timesheet_entry, user: employee, project:)
    end

    with_forgery_protection do
      visit "time-tracking"

      el = find(:css, "#deleteIcon", visible: false).hover
      el.click

      expect(page).to have_content("Timesheet deleted", wait: 3)
      if obj[:is_admin] == true
        expect(admin.timesheet_entries.size).to eq(0)
      else
        expect(employee.timesheet_entries.size).to eq(0)
      end
    end
  end
end
