# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Logout", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user want to logout" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "logout the current user when user clicks on logout" do
      with_forgery_protection do
        visit "/time-tracking"
        find("#logoutBtn").click()

        expect(page).to have_current_path("/")
        expect(page).to have_content("Sign In")
      end
    end
  end
end
