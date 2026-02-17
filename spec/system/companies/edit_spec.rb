# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit company", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }


  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing a company" do
    it "edit the company successfully", :pending do
      with_forgery_protection do
        # Navigate to settings through the UI
        visit "/"
        # Look for user menu or settings access in user dropdown
        find('div:has([data-testid="user-menu"]), .avatar, [data-testid="user-avatar"]', match: :first).click
        sleep 1

        # Look for organization settings or settings option
        if page.has_link?("Organization Settings", wait: 2)
          click_link "Organization Settings"
        elsif page.has_link?("Settings", wait: 2)
          click_link "Settings"
          sleep 1
          click_link "Organization" if page.has_link?("Organization", wait: 2)
        else
          # Direct navigation as fallback - might still work in some cases
          visit "/settings/organization"
        end

        # Wait for the org settings to load
        expect(page).to have_content("Organization Settings", wait: 10)

        # Click Edit button if present
        if page.has_button?("Edit", wait: 2)
          click_button "Edit"
        end

        fill_in "company_name", with: "test company"
        fill_in "address_line_1", with: "Test address"

        # Update address fields
        fill_in "state", with: "California"
        fill_in "city", with: "Los Angeles"
        fill_in "zipcode", with: "12238"

        click_button "Save"

        expect(page).to have_content("saved successfully", wait: 10)
        company.reload

        expect(company.name).to eq("test company")
      end
    end
  end

  context "when editing company with invalid values" do
    it "throws error when removing address1 value", :pending do
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

        # Wait for the org settings to load
        expect(page).to have_content("Organization Settings", wait: 10)

        # Click Edit button if present
        if page.has_button?("Edit", wait: 2)
          click_button "Edit"
        end

        # Clear the address field
        fill_in "address_line_1", with: ""

        click_button "Save"

        expect(page).to have_content("cannot be blank", wait: 5)
      end
    end
  end
end
