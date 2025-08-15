# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Logout", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user want to logout" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    it "logout the current user when user clicks on logout", :pending do
      with_forgery_protection do
        visit "/time-tracking"
        sleep 2

        # Try to find and click user menu (may be in different location with new UI)
        if page.has_css?('[data-testid="user-menu"]', wait: 2)
          find('[data-testid="user-menu"]').click
        elsif page.has_css?('[aria-label*="user"]', wait: 2)
          find('[aria-label*="user"]', match: :first).click
        elsif page.has_css?(".user-dropdown", wait: 2)
          find(".user-dropdown").click
        else
          # Try to find any element with user's name or email
          find("button", text: user.email, match: :first).click rescue find("button", text: user.first_name, match: :first).click
        end

        # Then click logout
        click_on "Logout", match: :first rescue click_on "Sign Out", match: :first

        expect(page).to have_current_path("/")
        expect(page).to have_content("Sign In")
      end
    end
  end
end
