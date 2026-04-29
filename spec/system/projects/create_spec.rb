# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Creating Project", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "opens the create project dialog" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content("Projects", wait: 10)

        click_button "New Project"

        expect(page).to have_text("Create project", wait: 10)
        expect(page).to have_field("Project name", wait: 10)
        expect(page).to have_button("Create project", disabled: true)
      end
    end

    it "creates a non-billable project with an existing client" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content("Projects", wait: 10)

        click_button "New Project"
        find("#client").click
        find("[role='option']", text: client.name).click
        fill_in "project-name", with: "Website redesign"
        find("[data-testid='non-billable-project-type']").click

        expect(page).to have_css(
          "[data-testid='non-billable-project-type'] button[data-state='checked']"
        )

        click_button "Create project"

        expect(page).to have_content("Website redesign", wait: 10)
        expect(Project.last).to have_attributes(
          client_id: client.id,
          billable: false
        )
      end
    end

    context "when creating a project without a name" do
      it "add project button is disabled" do
        with_forgery_protection do
          visit "/projects"
          expect(page).to have_content("Projects", wait: 10)

          click_button "New Project"
          fill_in "project-name", with: ""

          expect(page).to have_button("Create project", disabled: true)
        end
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in(user)
    end

    it "new project button should not be visible for employees" do
      with_forgery_protection do
        visit "/projects"
        expect(page).to have_content("Projects", wait: 10)

        expect(page).to have_no_button("New Project")
      end
    end
  end
end
