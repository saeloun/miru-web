# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Editing team member details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee_user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: employee_user)
      user.add_role :admin, company
      employee_user.add_role :employee, company
      sign_in(user)
    end

    context "when editing team member" do
      it "can edit a team member name" do
        with_forgery_protection do
          visit "/teams"

          el = all(:css, "#editMember", visible: false).last.hover
          el.click
          fill_in "First Name", with: "Edited"
          fill_in "Last Name", with: "User"
          click_button "SAVE CHANGES"

          expect(page).to have_content("Edited User")
        end
      end

      it "can edit a team member role" do
        with_forgery_protection do
          visit "/teams"

          el = all(:css, "#editMember", visible: false).last.hover
          el.click
          choose "Admin"
          click_button "SAVE CHANGES"

          expect(page).to have_content("Admin")
        end
      end
    end
  end
end
