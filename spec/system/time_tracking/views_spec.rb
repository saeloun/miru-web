# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking Views", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, first_name: "Admin", last_name: "Tracker", current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "Acme Corp") }
  let!(:project) { create(:project, client:, name: "Widget Platform") }

  before do
    create(:employment, company:, user:)
    create(:project_member, user:, project:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "loads the time tracking page with the current week" do
    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Time Tracking", wait: 10)
      expect(page).to have_content(Date.current.strftime("%A"), wait: 10)
        .or have_content(Date.current.strftime("%b"), wait: 10)
    end
  end

  it "shows an existing entry with client, project, note, and duration" do
    create(:timesheet_entry,
      user:,
      project:,
      duration: 360.0,
      note: "Implementing search feature",
      work_date: Date.current)

    with_forgery_protection do
      visit "/time-tracking"
      find("button[aria-label*='#{Date.current.strftime("%b")} #{Date.current.day}']", wait: 10).click

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Acme Corp", wait: 10)
      expect(page).to have_content("Widget Platform", wait: 10)
      expect(page).to have_content("Implementing search feature", wait: 10)
      expect(page).to have_content("06:00", wait: 10)
    end
  end

  it "shows leave and holiday entries in the review panel" do
    leave = create(:leave, company:, year: Date.current.year)
    leave_type = create(:leave_type, leave:, name: "Paid Time Off")
    holiday = create(:holiday, company:, year: Date.current.year)
    holiday_info = create(
      :holiday_info,
      holiday:,
      name: "Foundation Day",
      date: Date.current
    )

    create(
      :timeoff_entry,
      user:,
      leave_type:,
      leave_date: Date.current,
      duration: 480,
      note: "Planned PTO"
    )
    create(
      :timeoff_entry,
      user:,
      leave_type: nil,
      holiday_info:,
      leave_date: Date.current,
      duration: 240,
      note: "Company holiday"
    )

    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("[data-testid='timeoff-entry-card']", count: 2, wait: 10)
      expect(page).to have_content("Leave", wait: 10)
      expect(page).to have_content("Paid Time Off", wait: 10)
      expect(page).to have_content("Planned PTO", wait: 10)
      expect(page).to have_content("Holiday", wait: 10)
      expect(page).to have_content("Foundation Day", wait: 10)
      expect(page).to have_content("Company holiday", wait: 10)
    end
  end

  it "shows leave entries in week review even when the selected day is empty" do
    leave = create(:leave, company:, year: Date.current.year)
    leave_type = create(:leave_type, leave:, name: "Paid Time Off")
    leave_date = Date.current.beginning_of_week + 1.day
    create(
      :timeoff_entry,
      user:,
      leave_type:,
      leave_date:,
      duration: 480,
      note: "Week review PTO"
    )

    with_forgery_protection do
      visit "/time-tracking"
      find("[data-testid='time-review-week']", wait: 10).click

      expect(page).to have_content("Week review PTO", wait: 10)
      expect(page).to have_content("Paid Time Off", wait: 10)
      expect(page).to have_content(leave_date.strftime("%a, %b %-d"), wait: 10)
    end
  end

  it "lets an admin switch to another user" do
    employee = create(:user, first_name: "Jane", last_name: "Developer", current_workspace_id: company.id)
    create(:employment, company:, user: employee)
    create(:project_member, user: employee, project:)
    employee.add_role :employee, company
    create(:timesheet_entry,
      user: employee,
      project:,
      duration: 480.0,
      note: "Backend refactoring work",
      work_date: Date.current)

    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      find('[data-testid="user-select"]', wait: 10).click
      find('[role="option"]', text: employee.full_name, wait: 10).click

      expect(page).to have_content("Backend refactoring work", wait: 10)
        .or have_content("08:00", wait: 10)
    end
  end

  it "shows another employee's leave entries after switching users" do
    employee = create(:user, first_name: "Jane", last_name: "Developer", current_workspace_id: company.id)
    leave = create(:leave, company:, year: Date.current.year)
    leave_type = create(:leave_type, leave:, name: "Sick Leave")
    create(:employment, company:, user: employee)
    create(
      :timeoff_entry,
      user: employee,
      leave_type:,
      leave_date: Date.current,
      duration: 480,
      note: "Employee PTO verification"
    )
    employee.add_role :employee, company

    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      find('[data-testid="user-select"]', wait: 10).click
      find('[role="option"]', text: employee.full_name, wait: 10).click

      expect(page).to have_content("Leave", wait: 10)
      expect(page).to have_content("Sick Leave", wait: 10)
      expect(page).to have_content("Employee PTO verification", wait: 10)
    end
  end

  it "shows the empty state when no entries exist" do
    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("No time entries yet", wait: 10)
        .or have_content("Add Entry", wait: 10)
        .or have_content("00:00", wait: 10)
    end
  end
end
