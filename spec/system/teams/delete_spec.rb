# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Delete team member", type: :system, js: true do
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

    context "when deleting team member" do
      it "can delete a team member" do
        with_forgery_protection do
          visit "/teams"

          expect(page).to have_content(employee_user.first_name)

          el = all(:css, "#deleteMember", visible: false).last.hover
          el.click
          click_button "DELETE"
          expect(page).not_to have_content(employee_user.first_name)
        end
      end
    end
  end
end
