# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit Project", type: :system do
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

    it "updates the project successfully" do
      with_forgery_protection do
        visit "/projects"

        expect(page).to have_content(project.name)

        find("tbody").hover.click
        find("#kebabMenu").click
        click_button "Edit Project Details"
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
