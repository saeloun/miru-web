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

    it "closes an unchanged empty team without sending a member update" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content(project.name, wait: 10)
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        expect(page).to have_content(project.name, wait: 10)
        click_button "addRemoveTeamMembers"
        expect(page).to have_button("Save Members", disabled: false)
        page.save_screenshot(Rails.root.join("tmp", "project-members-empty.png"))
        click_button "Save Members"
        expect(page).not_to have_css("[role='dialog']")
        expect(project.project_members.kept).to be_empty
        expect(page.driver.browser.network.traffic.filter_map(&:request).map(&:url))
          .not_to include(a_string_including("/api/v1/project_members/#{project.id}"))
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

    it "removes the last project member and keeps the team empty when reopened" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content(project.name, wait: 10)
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        expect(page).to have_content(project.name, wait: 10)
        click_button "addRemoveTeamMembers"
        first(:button, "removeMember").click
        expect(page).to have_css("button#removeMember", count: 1)
        click_button "Save Members"
        expect(page).not_to have_css("[role='dialog']")
        expect(project.project_members.kept.pluck(:user_id)).to eq([user_3.id])
        click_button "addRemoveTeamMembers"
        first(:button, "removeMember").click
        expect(page).not_to have_css("button#removeMember")
        expect(page).to have_button("Save Members", disabled: false)
        click_button "Save Members"

        expect(page).not_to have_css("[role='dialog']")
        expect(project.project_members.kept).to be_empty
        expect(page).to have_content(project.name)
        click_button "addRemoveTeamMembers"
        expect(page).to have_css("[role='dialog']")
        expect(page).not_to have_field("Hourly rate")
        expect(page).to have_button("Save Members", disabled: false)
        page.save_screenshot(Rails.root.join("tmp", "project-members-removed.png"))
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
        click_button "Save Members"

        expect(page).to have_content(user_2.first_name)
        expect(page).to have_content("500")
        expect(page).to have_content(project.name)
      end
    end
  end
end
