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
      create(:timesheet_entry, user: admin, project:)
      login_as(admin)
    else
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:timesheet_entry, user: employee, project:)
      create(:project_member, user: employee, project:)
      login_as(employee)
    end
  end

  it "can view the time sheet entry" do
    with_forgery_protection do
      visit "time-tracking"

      if obj[:is_admin] == true
        expect(page).to have_content(admin.timesheet_entries.first.note)
      else
        expect(page).to have_content(employee.timesheet_entries.first.note)
      end
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
    with_forgery_protection do
      visit "time-tracking"

      el = find(:css, "#deleteIcon", visible: :hidden).hover
      el.click

      expect(page).to have_content("Timesheet deleted", wait: 3)
      if obj[:is_admin] == true
        expect(admin.timesheet_entries.size).to eq(0)
      else
        expect(employee.timesheet_entries.size).to eq(0)
      end
    end
  end

  it "editing the date moves it to the date set" do
    with_forgery_protection do
      visit "time-tracking"
      past_date = (Date.today - 1).strftime("%d")
      formatted_date = past_date.size == 2 ? "0#{past_date}" : "00#{past_date}"

      find(:css, "#editIcon", visible: false).hover.click
      find(:css, "#formattedDate", wait: 3).click
      find(:css, ".react-datepicker__day.react-datepicker__day--#{formatted_date}").click
      find(:css, "#formattedDate", wait: 3).click
      find(:css, ".react-datepicker__day.react-datepicker__day--#{formatted_date}").click
      click_button "UPDATE"

      if obj[:is_admin] == true
        expect(admin.timesheet_entries.first.work_date).to eq(Date.today - 1)
      else
        expect(employee.timesheet_entries.first.work_date).to eq(Date.today - 1)
      end
    end
  end

  it "shows correct total hours logged" do
    with_forgery_protection do
      visit "time-tracking"

      # NOTE: Signing again because devise routes and views haven't been removed yet.
      obj[:is_admin] == true ? sign_in(admin) : sign_in(employee)
      visit "time-tracking"

      hours = (employee.timesheet_entries.first.duration / 60).to_i
      minutes = (employee.timesheet_entries.first.duration % 60).to_i

      if hours >= 10 && minutes >= 10
        expected_duration = "#{hours}:#{minutes}"
      elsif hours < 10 && minutes >= 10
        expected_duration = "0#{hours}:#{minutes}"
      elsif hours < 10 && minutes < 10
        expected_duration = "0#{hours}:0#{minutes}"
      end
      total_hours = find_by_id(employee.timesheet_entries.first.duration.to_i).text

      expect(total_hours).to eq(expected_duration)
    end
  end
end
