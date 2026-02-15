# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Project listing", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:, name: "Acme Corp") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "displays the projects page" do
    with_forgery_protection do
      visit "/projects"

      expect(page).to have_current_path("/projects", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  context "with existing projects" do
    let!(:project) { create(:project, client:, name: "Miru Development") }

    before do
      create(:project_member, user:, project:)
    end

    it "shows the project name on the page" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Miru Development", wait: 10)
      end
    end

    it "shows the associated client name" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Miru Development", wait: 10)
        expect(page).to have_content("Acme Corp")
      end
    end

    it "displays the table headers" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PROJECT/CLIENT", wait: 10)
        expect(page).to have_content("HOURS LOGGED")
      end
    end
  end

  context "with billable and non-billable projects" do
    let!(:billable_project) { create(:project, client:, name: "Billable Work", billable: true) }
    let!(:non_billable_project) { create(:project, client:, name: "Internal Work", billable: false) }

    before do
      create(:project_member, user:, project: billable_project)
      create(:project_member, user:, project: non_billable_project)
    end

    it "shows both projects on the page" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Billable Work", wait: 10)
        expect(page).to have_content("Internal Work")
      end
    end

    it "displays the billable badge for billable projects" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Billable Work", wait: 10)
        expect(page).to have_content("billable")
      end
    end
  end

  context "with multiple projects across clients" do
    let!(:second_client) { create(:client, company:, name: "Beta Inc") }
    let!(:project_one) { create(:project, client:, name: "Project Alpha") }
    let!(:project_two) { create(:project, client: second_client, name: "Project Beta") }

    before do
      create(:project_member, user:, project: project_one)
      create(:project_member, user:, project: project_two)
    end

    it "shows all projects with their client associations" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Project Alpha", wait: 10)
        expect(page).to have_content("Acme Corp")
        expect(page).to have_content("Project Beta")
        expect(page).to have_content("Beta Inc")
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:assigned_project) { create(:project, client:, name: "Assigned Project") }
    let!(:unassigned_project) { create(:project, client:, name: "Unassigned Project") }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      create(:project_member, user: employee, project: assigned_project)
      Warden.test_reset!
      sign_in(employee)
    end

    it "can access the projects page" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/projects", wait: 10)
      end
    end

    it "shows only assigned projects" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Assigned Project", wait: 10)
        expect(page).not_to have_content("Unassigned Project")
      end
    end
  end

  context "with project members" do
    let!(:project) { create(:project, client:, name: "Team Project") }
    let!(:team_member) { create(:user, current_workspace_id: company.id, first_name: "Jane", last_name: "Smith") }

    before do
      create(:employment, company:, user: team_member)
      team_member.add_role :employee, company
      create(:project_member, user:, project:)
      create(:project_member, user: team_member, project:)
    end

    it "shows the project with team members" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Team Project", wait: 10)
      end
    end
  end

  context "when no projects exist" do
    it "shows the empty state message" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Looks like there aren't any projects added yet.", wait: 10)
      end
    end
  end
end
