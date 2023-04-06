# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit company", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing a company" do
    it "edit the company successfully" do
      with_forgery_protection do
        visit "/profile/edit"

        within("ul.tracking-wider") do
          find("div:nth-child(2) > button").click
        end

        find("a[href='/profile/edit/organization-details']").click
        click_button "Edit"
        fill_in "companyName", with: "test company"
        fill_in "addressLine1", with: "Test address"

        within("div#countrySelect") do
          find(".react-select-filter__control.css-digfch-control").click
          find("#react-select-9-option-232").click
        end
        within("div#stateSelect") do
          find(".react-select-filter__control.css-digfch-control").click
          find("#react-select-10-option-41").click
        end

        fill_in "zipcode", with: "12238"
        click_button "Save"

        expect(page).to have_content("Changes saved successfully")

        company.reload

        expect(company.name).to eq("test company")
      end
    end
  end

  context "when editing company with invalid values" do
    it "throws error when removing address1 value" do
      with_forgery_protection do
        visit "/profile/edit"
        
        within("ul.tracking-wider") do
            find('div:nth-child(2) > button').click
        end

        find("a[href='/profile/edit/organization-details']").click
        click_button "Edit"
        fill_in "addressLine1", with: ""
        
        click_button "Save"

        expect(page).to have_content("Address Line 1 cannot be blank")
      end
    end
  end
end
