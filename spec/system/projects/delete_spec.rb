# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Delete Project", type: :system, js: true do
  let(:company) { create(:company) }
  let!(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "delete the project successfully" do
      with_forgery_protection do
        visit "/projects"
        click_link "Projects"
        sleep 2

        expect(page).to have_content(project.name)

        # Find project row by content
        page.find(:xpath, "//tr[contains(., '#{project.name}')]").hover.click
        find("#kebabMenu").click
        click_button "Delete Project"
        click_button "DELETE"

        expect(page).not_to have_content(project.name)
        expect(page).not_to have_content(client.name)
      end
    end
  end
end
