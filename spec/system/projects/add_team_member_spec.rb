# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Add team member to project", type: :system, js: true do
  let(:company) { create(:company) }
  let!(:user) { create(:user, current_workspace_id: company.id) }
  let!(:user_2) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:, name: "Team Project Alpha") }

  context "when adding a project member for a project" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "opens add/remove team member modal for a project" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content(project.name, wait: 10)
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        expect(page).to have_content(project.name, wait: 10)
        click_button "addRemoveTeamMembers"
        expect(page).to have_button("Save team members", disabled: true, wait: 10)
      end
    end
  end

  context "when project member is already added to a project" do
    let!(:user_3) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: user_3)
      create(:project_member, user: user_2, project:)
      create(:project_member, user: user_3, project:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "can remove member from a project" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content(project.name, wait: 10)
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        expect(page).to have_content(project.name, wait: 10)
        click_button "addRemoveTeamMembers"
        first(:button, "removeMember").click
        click_button "Save team members"

        expect(page).not_to have_content(user_2.first_name)
        expect(page).to have_content(project.name)
      end
    end

    it "can edit the rate for a project member" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content(project.name, wait: 10)
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        expect(page).to have_content(project.name, wait: 10)
        click_button "addRemoveTeamMembers"
        first(:fillable_field, "Hourly rate").set("500")
        click_button "Save team members"

        expect(page).to have_content(user_2.first_name)
        expect(page).to have_content("500")
        expect(page).to have_content(project.name)
      end
    end
  end
end
