# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit employment details", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  def select_values_from_select_box
    within("div#employment_type_select") do
      find(".react-select-filter__control.css-digfch-control").click
      find("#react-select-1-option-232").click
    end
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing employment details" do
    it "edit the employment details successfully" do
      with_forgery_protection do
        visit "/teams"
        find(".hoverIcon", visible: false).hover.click
        click_on "EMPLOYEMENT DETAILS"
        click_button "Edit"

        fill_in "employee_id", with: "testID"
        fill_in "designation", with: "test designation"
        fill_in "email", with: "test@example.com"

        click_button "Update"

        expect(page).to have_content("Employment updated successfully")
      end
    end
  end
end
