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

  it "shows the projects page" do
    with_forgery_protection do
      visit "/projects"

      expect(page).to have_current_path("/projects", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "shows the empty state when no projects exist" do
    with_forgery_protection do
      visit "/projects"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("No projects yet", wait: 10)
      expect(page).to have_content("Create your first project to get started.", wait: 10)
    end
  end

  it "shows multiple projects and their client associations" do
    second_client = create(:client, company:, name: "Beta Inc")
    project_one = create(:project, client:, name: "Project Alpha", billable: true)
    project_two = create(:project, client: second_client, name: "Project Beta", billable: false)
    create(:project_member, user:, project: project_one)
    create(:project_member, user:, project: project_two)

    with_forgery_protection do
      visit "/projects"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Project Alpha", wait: 10)
      expect(page).to have_content("Acme Corp", wait: 10)
      expect(page).to have_content("Project Beta", wait: 10)
      expect(page).to have_content("Beta Inc", wait: 10)
      expect(page).to have_content("billable", wait: 10)
    end
  end

  it "shows only assigned projects for employees" do
    employee = create(:user, current_workspace_id: company.id)
    assigned_project = create(:project, client:, name: "Assigned Project")
    create(:project, client:, name: "Unassigned Project")
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    create(:project_member, user: employee, project: assigned_project)
    sign_in(employee)

    with_forgery_protection do
      visit "/projects"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Assigned Project", wait: 10)
      expect(page).not_to have_content("Unassigned Project")
    end
  end
end
