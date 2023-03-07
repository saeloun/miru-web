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

    it "can view the time sheet entry" do
      time_entry = create(:timesheet_entry, user: admin, project:)

      with_forgery_protection do
        visit "time-tracking"
        click_button "WEEK"

        click_button "<"
        click_button ">"
        expect(page).to have_content("08:00")
      end
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

    it "can view other users entry" do
      user_two = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: user_two)
      create(:project_member, user: user_two, project:)
      time_entry = create(:timesheet_entry, user: user_two, project:)
      with_forgery_protection do
        visit "time-tracking"

        click_button "WEEK"
        within(".css-6j8wv5-Input") do
          find("input#react-select-9-input").set(" ").set(user_two.full_name).send_keys(:tab)
        end

        expect(page).to have_content("08:00")
      end
    end
  end

  context "when user is employee" do
    before do
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)
      sign_in(employee)
    end

    it "can view the time sheet entry" do
      time_entry = create(:timesheet_entry, user: employee, project:)

      with_forgery_protection do
        visit "time-tracking"
        click_button "WEEK"

        click_button "<"
        click_button ">"
        expect(page).to have_content("08:00")
      end
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
