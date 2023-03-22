# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Add team memebr to project", type: :system do
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

    it "can add team member to a project" do
      with_forgery_protection do
        visit "/projects"

        find("tbody").hover.click
        find("#kebabMenu").click
        click_button "Add/Remove Team Members"
        sleep 1
        click_button "+ Add another team member"
        select user.first_name, from: "select-user"
        fill_in "Rate", with: "100"
        click_button "SAVE CHANGES"

        expect(page).to have_content(user.first_name, wait: 3)
        expect(page).to have_content("100", wait: 3)
        expect(page).to have_content(project.name)
      end
    end
  end
end
