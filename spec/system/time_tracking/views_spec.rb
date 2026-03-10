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

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Acme Corp", wait: 10)
      expect(page).to have_content("Widget Platform", wait: 10)
      expect(page).to have_content("Implementing search feature", wait: 10)
      expect(page).to have_content("06:00", wait: 10)
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
      find('[data-testid="user-select"], [role="combobox"]', match: :first, wait: 10).click
      find('[role="option"]', text: employee.full_name, wait: 10).click

      expect(page).to have_content("Backend refactoring work", wait: 10)
        .or have_content("08:00", wait: 10)
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
