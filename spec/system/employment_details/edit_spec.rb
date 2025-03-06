# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit employment details", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  def select_values_from_select_box
    find(:css, "#employment_type").click
    find("#react-select-3-option-0").click
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  context "when editing employment details" do
    it "edit the current employment details successfully" do
      with_forgery_protection do
        visit "/team/#{user.id}/employment"
        click_link "EMPLOYMENT DETAILS"
        click_button "Edit"
        find(:css, "#employee_id").set("testID")
        find(:css, "#designation").set("test designation")
        expect(find("#email").value).to eq user.email
        select_values_from_select_box
        sleep 3
        click_button "Update"
        expect(page).to have_content("Employment updated successfully")
      end
    end

    it "edit the previous employment details successfully" do
      with_forgery_protection do
        visit "/team/#{user.id}/employment"
        click_link "EMPLOYMENT DETAILS"
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
