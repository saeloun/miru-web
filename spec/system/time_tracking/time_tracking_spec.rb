# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking", type: :system do
  context "when user is admin" do
    before do
      @company = create(:company)
      @user = create(:user, current_workspace_id: @company.id)
      @employment = create(:employment, company: @company, user: @user)
      @client = create(:client, company: @company)
      @project = create(:project, client: @client)
      @project_member = create(:project_member, user: @user, project: @project)
      @user.add_role :admin, @company
      sign_in(@user)
    end

    it "can add time entry" do
      with_forgery_protection do
        visit "time-tracking"

        click_button "NEW ENTRY"
        select @client.name, from: "client"
        fill_in "notes",	with: "Testing note!"
        fill_in "timeInput", with: "8"
        click_button "SAVE"
        expect(page).to have_content("Timesheet created", wait: 3)
      end
    end

    it "can edit time entry" do
      create(:timesheet_entry, user: @user, project: @project)
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
      create(:timesheet_entry, user: @user, project: @project)
      with_forgery_protection do
        visit "time-tracking"

        el = find(:css, "#deleteIcon", visible: false).hover
        el.click
        expect(page).to have_content("Timesheet deleted", wait: 3)
      end
    end

    it "can view other users entry" do
      user_two = create(:user, current_workspace_id: @company.id)
      create(:employment, company: @company, user: user_two)
      create(:project_member, user: user_two, project: @project)
      time_entry = create(:timesheet_entry, user: user_two, project: @project)
      with_forgery_protection do
        visit "time-tracking"

        within(".css-6j8wv5-Input") do
          find("input#react-select-8-input").set(" ").set(user_two.full_name).send_keys(:tab)
        end

        expect(page).to have_content(time_entry.note)
      end
    end
  end
end
