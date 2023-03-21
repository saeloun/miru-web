# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Time Tracking - week view" do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    it_behaves_like "Time tracking - week view", is_admin: true

    it "can view other users entry" do
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      sign_in(admin)

      user_two = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: user_two)
      create(:project_member, user: user_two, project:)
      time_entry = create(:timesheet_entry, user: user_two, project:)
      with_forgery_protection do
        visit "time-tracking"

        click_button "WEEK"
        find("input#react-select-2-input").set(" ").set(user_two.full_name).send_keys(:tab)

        expect(page).to have_content("08:00")
      end
    end
  end

  context "when user is employee" do
    it_behaves_like "Time tracking - week view", is_admin: false
  end
end
