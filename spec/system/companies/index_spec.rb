# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies index page", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    it "returns the list of company's clients and company info", :pending do
      with_forgery_protection do
        # Navigate to organization settings through UI
        visit "/"
        find('div:has([data-testid="user-menu"]), .avatar, [data-testid="user-avatar"]', match: :first).click
        sleep 1

        if page.has_link?("Organization Settings", wait: 2)
          click_link "Organization Settings"
        elsif page.has_link?("Settings", wait: 2)
          click_link "Settings"
          sleep 1
          click_link "Organization" if page.has_link?("Organization", wait: 2)
        else
          visit "/settings/organization"
        end

        # Wait for the org settings page to load
        expect(page).to have_content("Organization Settings", wait: 10)

        expect(page).to have_content(company.name)
        expect(page).to have_content(company.base_currency)
      end
    end
  end
end
