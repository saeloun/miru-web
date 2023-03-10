# frozen_string_literal: true

require "rails_helper"
# require "./shared_examples/week_view"

RSpec.describe "Time Tracking - week view" do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let!(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    it_behaves_like "admin and employee views and add time entries", is_admin: true

    it "can view other users entry" do
      admin.add_role :admin, company
      create(:employment, company:, user: admin)
      create(:project_member, user: admin, project:)
      login_as(admin)

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
    it_behaves_like "admin and employee views and add time entries", is_admin: false
  end
end
