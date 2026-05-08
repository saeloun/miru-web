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

  def open_week_review
    visit "/time-tracking"
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_css("[data-testid='time-review-week']", wait: 10)
    find("[data-testid='time-review-week']").click
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
        open_week_review
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Worked on feature implementation", wait: 10)
        expect(page).to have_content("08:00", wait: 10)
        expect(page).to have_content("Week Total", wait: 10)
          .or have_content("8h", wait: 10)
      end
    end

    it "shows AI source badges for assisted entries" do
      entry.update!(
        source: "mcp",
        source_metadata: {
          tool: "codex",
          skill: "gstack-qa",
          mcp_server: "github"
        }
      )

      with_forgery_protection do
        open_week_review
        expect(page).to have_content("Codex via MCP", wait: 10)
        expect(page).to have_content("gstack-qa", wait: 10)
        expect(page).to have_content("github", wait: 10)
      end
    end

    it "resumes the timer from an existing entry" do
      with_forgery_protection do
        open_week_review
        find("[data-testid='resume-timer-entry']", wait: 10).click

        expect(page).to have_css("[data-testid='inline-web-timer']", wait: 10)
        expect(page).to have_text("Pause", wait: 10)
        expect(page).to have_text("Alpha Project", wait: 10)
        expect(page).to have_field(
          "timer-description-inline",
          with: "Worked on feature implementation",
          wait: 10
        )
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
        open_week_review
        expect(page).to have_content("Alpha Client", wait: 10)
        expect(page).to have_content("Beta Client", wait: 10)
        expect(page).to have_content("Alpha Project", wait: 10)
        expect(page).to have_content("Beta Project", wait: 10)
      end
    end
  end

  context "with entries for multiple employees" do
    let(:employee) do
      create(
        :user,
        current_workspace_id: company.id,
        first_name: "Taylor",
        last_name: "Employee"
      )
    end

    before do
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      employee.add_role :employee, company
      create(:timesheet_entry,
        user:,
        project:,
        duration: 120.0,
        note: "Admin-only planning",
        work_date: Date.current)
      create(:timesheet_entry,
        user: employee,
        project:,
        duration: 180.0,
        note: "Employee-only delivery",
        work_date: Date.current)
    end

    it "does not leak another employee's entries until the admin switches users" do
      with_forgery_protection do
        open_week_review

        expect(page).to have_content("Admin-only planning", wait: 10)
        expect(page).not_to have_content("Employee-only delivery")
        expect(page).to have_content("2h", wait: 10)
        expect(page).to have_content("1 entry", wait: 10)

        find('[data-testid="user-select"]', wait: 10).click
        find('[role="option"]', text: employee.full_name, wait: 10).click
        find("[data-testid='time-review-week']", wait: 10).click

        expect(page).to have_content("Employee-only delivery", wait: 10)
        expect(page).not_to have_content("Admin-only planning")
        expect(page).to have_content("3h", wait: 10)
        expect(page).to have_content("1 entry", wait: 10)
      end
    end
  end

  context "with discarded entries" do
    before do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 120.0,
        note: "Active review entry",
        work_date: Date.current)
      discarded_entry = create(:timesheet_entry,
        user:,
        project:,
        duration: 300.0,
        note: "Discarded review entry",
        work_date: Date.current)
      discarded_entry.discard
    end

    it "excludes discarded entries from week review and totals" do
      with_forgery_protection do
        open_week_review

        expect(page).to have_content("Active review entry", wait: 10)
        expect(page).not_to have_content("Discarded review entry")
        expect(page).to have_content(/week total/i, wait: 10)
        expect(page).to have_content("2h", wait: 10)
        expect(page).to have_content("1 entry", wait: 10)
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
      sign_in(employee)
    end

    it "shows the employee's own entry context" do
      with_forgery_protection do
        open_week_review
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

    it "hides the empty state while adding an entry" do
      with_forgery_protection do
        visit "/time-tracking"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No time entries yet", wait: 10)

        find("button", text: /Add Entry/, match: :first, wait: 10).click

        expect(page).to have_button("Save Entry", disabled: true, wait: 10)
        expect(page).to have_no_content("No time entries yet", wait: 10)
        expect(page).to have_no_content(
          'Click "Add Entry" to log your first time entry for this day',
          wait: 10
        )
      end
    end
  end
end
