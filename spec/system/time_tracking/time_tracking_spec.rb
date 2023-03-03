# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project_member) { create(:project_member, user:, project:) }

  context "when user is admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "can add time entry" do
      with_forgery_protection do
        visit "time-tracking"

        click_button "NEW ENTRY"
        select client.name, from: "client"
        fill_in "notes",	with: "Testing note!"
        fill_in "timeInput", with: "8"
        click_button "SAVE"
        expect(page).to have_content("Timesheet created", wait: 3)
      end
    end

    it "can edit time entry" do
      create(:timesheet_entry, user:, project:)
      with_forgery_protection do
        visit "time-tracking"

        el = find(:css, "#editIcon", visible: false).hover
        el.click
        fill_in "notes",	with: "Testing note!"
        click_button "UPDATE"
        expect(page).to have_content("Timesheet updated", wait: 3)
      end
    end

    it "can delete time entry" do
      create(:timesheet_entry, user:, project:)
      with_forgery_protection do
        visit "time-tracking"

        el = find(:css, "#deleteIcon", visible: false).hover
        el.click
        expect(page).to have_content("Timesheet deleted", wait: 3)
      end
    end
  end
end
