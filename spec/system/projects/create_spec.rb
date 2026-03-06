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

    context "when creating a billable project" do
      it "creates a billable project successfully" do
        with_forgery_protection do
          visit "/projects"
          expect(page).to have_content("Projects", wait: 10)

          click_button "New Project"
          find("button#client", wait: 10).click
          find("[role='option']", text: client.name, wait: 10).click
          fill_in "project-name", with: "Test Project"
          find("label", text: "Billable", wait: 10).click
          click_button "Add Project"

          expect(page).to have_content("Test Project", wait: 5)
          expect(page).to have_content(client.name)
          expect(page).to have_content("Billable")
        end
      end
    end

    context "when creating a non-billable" do
      it "creates a non-billable project successfully" do
        with_forgery_protection do
          visit "/projects"
          expect(page).to have_content("Projects", wait: 10)

          click_button "New Project"
          find("button#client", wait: 10).click
          find("[role='option']", text: client.name, wait: 10).click
          fill_in "project-name", with: "Non Billable Project"
          find("label", text: "Non-billable", wait: 10).click
          click_button "Add Project"

          expect(page).to have_content("Non Billable Project", wait: 5)
          expect(page).to have_content(client.name)
        end
      end
    end

    context "when creating a project without a name" do
      it "add project button is disabled" do
        with_forgery_protection do
          visit "/projects"
          expect(page).to have_content("Projects", wait: 10)

          click_button "New Project"
          find("button#client", wait: 10).click
          find("[role='option']", text: client.name, wait: 10).click
          fill_in "project-name", with: ""
          find("label", text: "Non-billable", wait: 10).click

          expect(page).to have_button("Add Project", disabled: true)
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
