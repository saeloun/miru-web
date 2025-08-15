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
      it "can edit a team member name", :pending do
        with_forgery_protection do
          visit "/"

          # First, try to navigate using the sidebar
          find("a", text: "Teams").click

          # Wait for teams page to load
          expect(page).to have_current_path(/\/teams/)
          expect(page).to have_content(employee_user.first_name)

          # Look for edit button - try multiple strategies
          if page.has_css?('button[aria-label*="Edit"]', wait: 2)
            find('button[aria-label*="Edit"]').click
          elsif page.has_css?("button:has(svg)", wait: 2)
            # Find button with edit icon (EditIcon component)
            buttons_with_svg = all("button:has(svg)", visible: :all)
            edit_button = buttons_with_svg.find { |btn| btn[:title]&.include?("Edit") || btn.find("svg", visible: false)["data-icon"] == "edit" rescue false }
            edit_button&.click || buttons_with_svg.last&.click # fallback to last button
          else
            # Fallback: click on the row first then look for edit options
            find("tr", text: employee_user.first_name).click
            sleep 1
            find("button", text: "Edit").click rescue find("button:has(svg)").click
          end

          # Wait for modal to open and fill in the form
          fill_in "First Name", with: "Edited"
          fill_in "Last Name", with: "User"
          click_button "SAVE CHANGES"

          expect(page).to have_content("Edited User")
        end
      end

      it "can edit a team member role", :pending do
        with_forgery_protection do
          visit "/"

          # First, try to navigate using the sidebar
          find("a", text: "Teams").click

          # Wait for teams page to load
          expect(page).to have_current_path(/\/teams/)
          expect(page).to have_content(employee_user.first_name)

          # Look for edit button - try multiple strategies
          if page.has_css?('button[aria-label*="Edit"]', wait: 2)
            find('button[aria-label*="Edit"]').click
          elsif page.has_css?("button:has(svg)", wait: 2)
            # Find button with edit icon (EditIcon component)
            buttons_with_svg = all("button:has(svg)", visible: :all)
            edit_button = buttons_with_svg.find { |btn| btn[:title]&.include?("Edit") || btn.find("svg", visible: false)["data-icon"] == "edit" rescue false }
            edit_button&.click || buttons_with_svg.last&.click # fallback to last button
          else
            # Fallback: click on the row first then look for edit options
            find("tr", text: employee_user.first_name).click
            sleep 1
            find("button", text: "Edit").click rescue find("button:has(svg)").click
          end

          # Wait for modal to open and choose role
          choose "Admin"
          click_button "SAVE CHANGES"

          expect(page).to have_content("Admin")
        end
      end
    end
  end
end
