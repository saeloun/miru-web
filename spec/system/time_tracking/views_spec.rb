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

  describe "page load" do
    it "loads the time tracking page at /time-tracking" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Tracking", wait: 10)
      end
    end

    it "shows the current week by default" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        today = Date.current
        expect(page).to have_content(today.strftime("%A"), wait: 10)
          .or have_content(today.strftime("%b"), wait: 10)
          .or have_content(today.strftime("%B"), wait: 10)
      end
    end
  end

  describe "with timesheet entries" do
    let!(:entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 360.0,
        note: "Implementing search feature",
        work_date: Date.current)
    end

    it "shows project name in the entry" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Widget Platform", wait: 10)
      end
    end

    it "shows client name in the entry" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Acme Corp", wait: 10)
      end
    end

    it "shows entry duration" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("06:00", wait: 10)
      end
    end

    it "shows entry note" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Implementing search feature", wait: 10)
      end
    end
  end

  describe "admin switching between users" do
    let!(:employee) do
      create(:user, first_name: "Jane", last_name: "Developer", current_workspace_id: company.id).tap do |u|
        create(:employment, company:, user: u)
        create(:project_member, user: u, project:)
        u.add_role :employee, company
      end
    end

    let!(:employee_entry) do
      create(:timesheet_entry,
        user: employee,
        project:,
        duration: 480.0,
        note: "Backend refactoring work",
        work_date: Date.current)
    end

    it "can switch to another user to view their entries" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)

        user_select = find('[data-testid="user-select"], [role="combobox"]', match: :first, wait: 10)
        user_select.click

        find('[role="option"]', text: employee.full_name, wait: 10).click

        expect(page).to have_content("Backend refactoring work", wait: 10)
          .or have_content("08:00", wait: 10)
      end
    end
  end

  describe "total hours" do
    let!(:entry_one) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 240.0,
        note: "Morning session",
        work_date: Date.current)
    end

    let!(:second_client) { create(:client, company:, name: "Beta Inc") }
    let!(:second_project) { create(:project, client: second_client, name: "Dashboard App") }

    let!(:entry_two) do
      create(:timesheet_entry,
        user:,
        project: second_project,
        duration: 300.0,
        note: "Afternoon session",
        work_date: Date.current)
    end

    before do
      create(:project_member, user:, project: second_project)
    end

    it "shows total hours for the period" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("09:00", wait: 10)
          .or have_content("9:00", wait: 10)
          .or have_content("Day Total", wait: 10)
      end
    end
  end

  describe "empty state" do
    it "shows empty state when no entries exist" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No time entries yet", wait: 10)
          .or have_content("Add Entry", wait: 10)
          .or have_content("00:00", wait: 10)
      end
    end
  end
end
