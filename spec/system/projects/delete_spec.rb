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
        expect(page).to have_content("Projects", wait: 10)

        expect(page).to have_content(project.name)

        within(:xpath, "//tr[contains(., '#{project.name}')]") do
          find("button#kebabMenu", wait: 10).click
        end
        find("[role='menuitem']", text: "Delete Project", wait: 10).click
        click_button "DELETE"

        expect(page).not_to have_content(project.name)
        expect(page).not_to have_content(client.name)
      end
    end
  end
end
