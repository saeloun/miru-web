# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking", type: :system do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    it_behaves_like "Time tracking", is_admin: true

    it "can view other users entry" do
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      user_two = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: user_two)
      create(:project_member, user: user_two, project:)
      time_entry = create(:timesheet_entry, user: user_two, project:)

      with_forgery_protection do
        visit "time-tracking"
        sign_in(admin)

        find("input#react-select-2-input").set(" ").set(user_two.full_name).send_keys(:tab)

        expect(page).to have_content(time_entry.note)
      end
    end
  end

  context "when user is employee" do
    it_behaves_like "Time tracking", is_admin: false

    it "can only see the projects assigned to them" do
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)

      user_two = create(:user, current_workspace_id: company.id)
      client_two = create(:client, company:)
      project_two = create(:project, client: client_two, name: "Project Two")
      create(:project_member, user: user_two, project: project_two)

      with_forgery_protection do
        visit "time-tracking"
        sign_in(employee)

        click_button "NEW ENTRY"
        find(:css, "#client")
        expect(page).to have_select("client", options: ["Client", client.name])
      end
    end

    it "cannot edit or delete billed projects" do
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      create(:project_member, user: employee, project:)

      project_two = create(:project, client:, name: "Project Two", billable: true)
      create(:project_member, user: employee, project: project_two)
      time_entry = create(:timesheet_entry, user: employee, project: project_two)
      time_entry.update!(bill_status: "billed")

      with_forgery_protection do
        visit "time-tracking"
        sign_in(employee)

        expect(page).not_to have_selector("#editIcon")
        expect(page).not_to have_selector("#deleteIcon")
      end
    end
  end
end
