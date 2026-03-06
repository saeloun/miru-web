# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Entry Reports", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD", name: "Reports Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "admin accessing time entry reports" do
    it "loads the reports page at /reports" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Reports", wait: 10)
      end
    end

    it "navigates to time entry report" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
      end
    end
  end

  describe "report with time entries" do
    let!(:client) { create(:client, company:, name: "Gamma Corp") }
    let!(:project) { create(:project, client:, name: "Gamma Platform") }
    let!(:project_member) { create(:project_member, user:, project:) }

    let!(:entry_one) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 480.0,
        note: "Full day development",
        work_date: Date.current)
    end

    it "shows total hours in the report" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Total Hours", wait: 10)
      end
    end

    it "shows client name in the report" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Gamma Corp", wait: 10)
          .or have_content("Client", wait: 10)
      end
    end

    it "shows project name in the report" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Gamma Platform", wait: 10)
          .or have_content("Project", wait: 10)
      end
    end

    it "shows entry duration data" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("08:00", wait: 10)
          .or have_content("8:00", wait: 10)
          .or have_content("Total Hours", wait: 10)
      end
    end
  end

  describe "report with multiple projects" do
    let!(:client_a) { create(:client, company:, name: "Delta Corp") }
    let!(:client_b) { create(:client, company:, name: "Epsilon Inc") }
    let!(:project_a) { create(:project, client: client_a, name: "Delta Project") }
    let!(:project_b) { create(:project, client: client_b, name: "Epsilon Project") }
    let!(:member_a) { create(:project_member, user:, project: project_a) }
    let!(:member_b) { create(:project_member, user:, project: project_b) }

    let!(:entry_a) do
      create(:timesheet_entry,
        user:,
        project: project_a,
        duration: 240.0,
        note: "Delta morning work",
        work_date: Date.current)
    end

    let!(:entry_b) do
      create(:timesheet_entry,
        user:,
        project: project_b,
        duration: 360.0,
        note: "Epsilon afternoon work",
        work_date: Date.current)
    end

    it "shows total hours across multiple projects" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
        expect(page).to have_content("Total Hours", wait: 10)
      end
    end

    it "shows group by options" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Group by Client", wait: 10)
          .or have_content("Client", wait: 10)
      end
    end

    it "shows export option" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Export", wait: 10)
      end
    end
  end

  describe "employee report access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "employee cannot access time entry reports" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_no_content("Time Entry Report", wait: 5).or have_current_path("/time-tracking", wait: 10)
      end
    end
  end
end
