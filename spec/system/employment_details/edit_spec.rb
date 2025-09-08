# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit employment details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }


  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing employment details" do
    it "edit the current employment details successfully" do
      pending "Employment details page needs to be updated for new UI"

      with_forgery_protection do
        visit "/team/#{user.id}/employment"

        # Wait for the page to load
        expect(page).to have_content(user.first_name, wait: 10)

        # Look for employment details section
        if page.has_link?("EMPLOYMENT DETAILS", wait: 2)
          click_link "EMPLOYMENT DETAILS"
        end

        click_button "Edit"
        find(:css, "#employee_id").set("testID")
        find(:css, "#designation").set("test designation")
        expect(find("#email").value).to eq user.email

        # Handle employment type selection with new shadcn select
        if page.has_css?("#employment_type", wait: 2)
          find(:css, "#employment_type").click
          find("[role='option']", match: :first).click
        end

        sleep 3
        click_button "Update"
        expect(page).to have_content("Employment updated successfully")
      end
    end

    it "edit the previous employment details successfully" do
      pending "Employment details page needs to be updated for new UI"

      with_forgery_protection do
        visit "/team/#{user.id}/employment"

        # Wait for the page to load
        expect(page).to have_content(user.first_name, wait: 10)

        if page.has_link?("EMPLOYMENT DETAILS", wait: 2)
          click_link "EMPLOYMENT DETAILS"
        end

        click_button "Edit"
        sleep 10
        click_button "+ Add Past Employment"
        find(:css, "#company_name").set("test company")
        find(:css, "#role").set("test role")

        click_button "Update"
        expect(page).to have_content("Employment updated successfully")
      end
    end
  end
end
