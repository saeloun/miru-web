# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - week view" do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      sign_in(admin)
    end

    it "can add time entry" do
      with_forgery_protection do
        visit "time-tracking"

        click_button "WEEK"
        click_button "NEW ROW"
        select client.name, from: "client"
        click_button "SAVE"
        find(:css, "#inputClick_0").click
        find(:css, "#selectedInput").set("8")
        fill_in placeholder: "Note", with: "Weekly note!"
        click_button "SAVE"
        expect(page).to have_content("Timesheet created", wait: 3)
      end
    end
  end
end
