# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Employment index page", type: :system, js: true do
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

    it "returns the employment details", :pending do
      with_forgery_protection do
        # Navigate to the team page first, then to employment details
        visit "/"
        click_link "Team"
        sleep 2

        # Find the user row and click on it to view employment details
        user_row = find(:xpath, "//tr[contains(., '#{user.first_name}')]", match: :first)
        user_row.click

        # Wait for page to stabilize and then click Employment Details tab
        expect(page).to have_link("EMPLOYMENT DETAILS", wait: 10)
        find(:link, "EMPLOYMENT DETAILS").click
        sleep 2

        # Now check for employment details content
        expect(page).to have_content(user.employments.kept.first.employee_id)
        expect(page).to have_content(user.employments.kept.first.designation)
      end
    end
  end
end
