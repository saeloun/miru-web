# frozen_string_literal: true

require "rails_helper"

shared_examples_for "Time tracking - week view" do |obj|
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    if obj[:is_admin] == true
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      create(:timesheet_entry, user: admin, project:)
      sign_in(admin)
    else
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      create(:timesheet_entry, user: employee, project:)
      sign_in(employee)
    end
  end

  it "can view the time sheet entry" do
    with_forgery_protection do
      visit "time-tracking"

      click_button "WEEK"
      find_by_id("prevMonth").click
      find_by_id("nextMonth").click

      expect(page).to have_content("08:00")
    end
  end

  it "can add time entry" do
    user = obj[:is_admin] == true ? admin : employee
    weekday_number = Time.current.wday - 1

    with_forgery_protection do
      visit "time-tracking"

      click_button "WEEK"
      click_button "NEW ROW"
      select client.name, from: "client"
      click_button "SAVE"
      first(:css, "#inputClick_#{weekday_number}", match: :first).click
      find(:css, "#selectedInput").set("8")
      fill_in placeholder: "Note", with: "Weekly note!"
      click_button "SAVE"
      sleep 1

      expect(user.timesheet_entries.size).to eq(2)
    end
  end

  it "can edit time entry" do
    user = obj[:is_admin] == true ? admin : employee
    weekday_number = Time.current.wday - 1 # Adding minus one because on frontend the numbering starts from 0

    with_forgery_protection do
      visit "time-tracking"

      click_button "WEEK"
      find_by_id("prevMonth").click
      find_by_id("nextMonth").click
      find(:css, "#inputClick_#{weekday_number}", match: :first).click
      find(:css, "#selectedInput").set("10")
      fill_in placeholder: "Note", with: "Weekly note!"
      click_button "UPDATE"
      sleep 2

      expect(user.timesheet_entries.first.duration).to eq(600.0)
      expect(user.timesheet_entries.first.note).to eq("Weekly note!")
    end
  end
end
