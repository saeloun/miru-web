# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Add team member to project", type: :system, js: true do
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

    it "can add project member to a project", :pending do
      with_forgery_protection do
        visit "/projects"
        click_link "Projects"
        sleep 2

        # Wait for the project table to load and find project name
        expect(page).to have_content(project.name, wait: 10)

        # Try to find project row by content or use a more generic selector
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        click_button(id: "addMember")

        # Try clicking the add team member text
        find(:xpath, "//*[contains(text(), 'Add team member')]").click
        sleep 1

        # The first field is a React Select component for team members
        # Click on the first react select control to open dropdown
        find(".react-select-filter__control", match: :first).click
        sleep 1
        # Select the first available team member option
        find(".react-select-filter__option", match: :first).click
        # Set the rate in the number input
        find('input[type="number"]', match: :first).set("100")

        # Try to remove the empty second row by finding and clicking delete/remove button
        if page.has_css?("button", text: "×") || page.has_css?("button", text: "X")
          find("button", text: /[×X]/, match: :first).click
          sleep 1
        end

        sleep 2  # Wait for validation to complete

        # Find the Save Changes button using a more flexible approach
        save_button = find(:xpath, "//button[contains(text(), 'Save Changes')]")
        # Use JavaScript to force click the button
        execute_script("arguments[0].click()", save_button)

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
        click_link "Projects"
        sleep 2

        # Wait for the project table to load and find project name
        expect(page).to have_content(project.name, wait: 10)

        # Try to find project row by content or use a more generic selector
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        click_button "removeMember"
        click_button "Save Changes"

        expect(page).not_to have_content(user_2.first_name)
        expect(page).to have_content(project.name)
      end
    end

    it "can edit the rate for a project member" do
      with_forgery_protection do
        visit "/projects"
        click_link "Projects"
        sleep 2

        # Wait for the project table to load and find project name
        expect(page).to have_content(project.name, wait: 10)

        # Try to find project row by content or use a more generic selector
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        click_button "addRemoveTeamMembers"
        sleep 1
        fill_in "Rate", with: "500"
        click_button "Save Changes"

        expect(page).to have_content(user_2.first_name)
        expect(page).to have_content("500")
        expect(page).to have_content(project.name)
      end
    end
  end
end
