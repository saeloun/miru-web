# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Add team member to project", type: :system do
  let(:company) { create(:company) }
  let!(:user) { create(:user, current_workspace_id: company.id) }
  let!(:user_2) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }

  context "when adding a project member for a project" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "can add project member to a project" do
      with_forgery_protection do
        visit "/projects"

        find("tbody").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        click_button(id: "addMember")
        find(".react-select-filter__control.css-digfch-control").click
        find("#react-select-2-option-0").click
        fill_in "Rate", with: "100"
        click_button "Add team members to project"

        expect(page).to have_content(user.first_name)
        expect(page).to have_content("100")
        expect(page).to have_content(project.name)
      end
    end
  end

  context "when project member is already added to a project" do
    before do
      create(:employment, company:, user:)
      create(:project_member, user: user_2, project:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "can remove member from a project" do
      with_forgery_protection do
        visit "/projects"

        find("tbody").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        click_button "removeMember"
        click_button "Add team members to project"

        expect(page).not_to have_content(user_2.first_name)
        expect(page).to have_content(project.name)
      end
    end

    it "can edit the rate for a project member" do
      with_forgery_protection do
        visit "/projects"

        find("tbody").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        fill_in "Rate", with: "500"
        click_button "Add team members to project"

        expect(page).to have_content(user.first_name)
        expect(page).to have_content("500")
        expect(page).to have_content(project.name)
      end
    end
  end
end
