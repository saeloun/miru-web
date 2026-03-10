# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking Entries", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "Alpha Client") }
  let!(:project) { create(:project, client:, name: "Alpha Project") }

  before do
    create(:employment, company:, user:)
    create(:project_member, user:, project:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "loads the time tracking page and primary action" do
    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Time Tracking", wait: 10)
      expect(page).to have_content("Add Entry", wait: 10)
        .or have_css("button", text: /add entry/i, wait: 10)
    end
  end

  context "with existing entries" do
    let!(:entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 480.0,
        note: "Worked on feature implementation",
        work_date: Date.current)
    end

    it "shows the entry with client, project, note, and duration" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Worked on feature implementation", wait: 10)
        expect(page).to have_content("08:00", wait: 10)
        expect(page).to have_content("Day Total", wait: 10)
          .or have_content("8h", wait: 10)
      end
    end
  end

  context "with multiple projects in the same day" do
    let!(:second_client) { create(:client, company:, name: "Beta Client") }
    let!(:second_project) { create(:project, client: second_client, name: "Beta Project") }

    before do
      create(:project_member, user:, project: second_project)
      create(:timesheet_entry, user:, project:, duration: 240.0, note: "Morning standup and planning", work_date: Date.current)
      create(:timesheet_entry, user:, project: second_project, duration: 300.0, note: "Code review session", work_date: Date.current)
    end

    it "shows entries from multiple clients and projects" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Beta Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Beta Project", wait: 10)
      end
    end
  end

  context "when employee views their own entries" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      employee.add_role :employee, company
      create(:timesheet_entry,
        user: employee,
        project:,
        duration: 360.0,
        note: "Frontend development work",
        work_date: Date.current)
      Warden.test_reset!
      sign_in(employee)
    end

    it "shows the employee's own entry context" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Frontend development work", wait: 10)
        expect(page).to have_content("06:00", wait: 10)
      end
    end
  end

  context "when no entries exist" do
    it "shows the empty state" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No time entries yet", wait: 10)
          .or have_content("Add Entry", wait: 10)
      end
    end
  end
end
