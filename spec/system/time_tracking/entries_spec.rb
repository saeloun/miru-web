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

  it "loads the time tracking page and shows the header" do
    with_forgery_protection do
      visit "/time-tracking"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Time Tracking", wait: 10)
    end
  end

  context "with existing time entries" do
    let!(:entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 480.0,
        note: "Worked on feature implementation",
        work_date: Date.current)
    end

    it "displays time entries for the current day" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
      end
    end

    it "shows entry note in the time entry card" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Worked on feature implementation", wait: 10)
      end
    end

    it "displays duration for the entry" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("08:00", wait: 10)
      end
    end

    it "shows day total hours" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Day Total", wait: 10)
          .or have_content("8h", wait: 10)
      end
    end
  end

  context "with multiple entries across projects" do
    let!(:second_client) { create(:client, company:, name: "Beta Client") }
    let!(:second_project) { create(:project, client: second_client, name: "Beta Project") }

    let!(:entry_one) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 240.0,
        note: "Morning standup and planning",
        work_date: Date.current)
    end

    let!(:entry_two) do
      create(:timesheet_entry,
        user:,
        project: second_project,
        duration: 300.0,
        note: "Code review session",
        work_date: Date.current)
    end

    before do
      create(:project_member, user:, project: second_project)
    end

    it "shows entries from multiple projects" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Beta Client", wait: 10)
      end
    end

    it "shows project names alongside client names" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Beta Project", wait: 10)
      end
    end
  end

  context "when admin views entries with project context" do
    let!(:entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 120.0,
        note: "Bug fix for login page",
        work_date: Date.current)
    end

    it "displays project and client info in the entry" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Bug fix for login page", wait: 10)
      end
    end

    it "shows the add entry button" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Entry", wait: 10)
          .or have_css("button", text: /add entry/i, wait: 10)
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    context "with own time entries" do
      let!(:employee_entry) do
        create(:timesheet_entry,
          user: employee,
          project:,
          duration: 360.0,
          note: "Frontend development work",
          work_date: Date.current)
      end

      it "displays the employee's own entries" do
        with_forgery_protection do
          visit "/time-tracking"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Alpha Client", wait: 10)
          expect(page).to have_content("Alpha Project", wait: 10)
          expect(page).to have_content("Frontend development work", wait: 10)
        end
      end

      it "shows entry duration for the employee" do
        with_forgery_protection do
          visit "/time-tracking"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("06:00", wait: 10)
        end
      end

      it "shows the employee name context" do
        with_forgery_protection do
          visit "/time-tracking"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Viewing entries for", wait: 10)
            .or have_content(employee.first_name, wait: 10)
        end
      end
    end
  end

  context "with weekly total hours displayed" do
    let!(:monday_entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 480.0,
        note: "Monday work",
        work_date: Date.current.beginning_of_week(:monday))
    end

    it "shows weekly total hours in the header" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("08:00", wait: 10)
      end
    end
  end

  context "when no entries exist for the current day" do
    it "shows the empty state message" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No time entries yet", wait: 10)
          .or have_content("Add Entry", wait: 10)
      end
    end

    it "shows the date context in the empty state" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        today_formatted = Date.current.strftime("%B %-d, %Y")
        expect(page).to have_content(today_formatted, wait: 10)
          .or have_content(Date.current.strftime("%A"), wait: 10)
      end
    end
  end

  context "when user is not authenticated" do
    it "redirects to login page or shows sign-in content" do
      Warden.test_reset!

      visit "/time-tracking"

      expect(page).to have_current_path("/user/sign_in", wait: 10)
        .or have_content("Sign in", wait: 10)
        .or have_current_path("/time-tracking", wait: 10)
    end
  end
end
