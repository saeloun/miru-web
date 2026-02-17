# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit Project", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "updates the project successfully", :pending do
      with_forgery_protection do
        visit "/projects"
        sleep 2

        expect(page).to have_content(project.name)

        # Find project row by content
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        find("#kebabMenu").click
        click_button "Edit"
        sleep 1
        fill_in "project-name", with: "Updated Project"
        choose "Non-billable"
        click_button "SAVE CHANGES"

        expect(page).to have_content("Updated Project")
        expect(page).to have_content(client.name)
      end
    end
  end
end
