# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Creating Project", type: :system do
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

          click_button "NEW PROJECT"
          sleep 1
          select client.name, from: "select-client"
          fill_in "project-name", with: "Test Project"
          choose "Billable"
          click_button "ADD PROJECT"

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

          click_button "NEW PROJECT"
          sleep 1
          select client.name, from: "select-client"
          fill_in "project-name", with: "Non Billable Project"
          choose "Non-billable"
          click_button "ADD PROJECT"

          expect(page).to have_content("Non Billable Project", wait: 5)
          expect(page).to have_content(client.name)
        end
      end
    end

    context "when creating a project without a name" do
      it "add project button is disabled" do
        with_forgery_protection do
          visit "/projects"

          click_button "NEW PROJECT"
          sleep 1
          select client.name, from: "select-client"
          fill_in "project-name", with: ""
          choose "Non-billable"

          expect(page).to have_button("ADD PROJECT", disabled: true)
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

        expect(page).to have_no_button("NEW PROJECT")
      end
    end
  end
end
