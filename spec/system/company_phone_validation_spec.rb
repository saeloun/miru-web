# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Company Phone Number Validation", :js, type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company:, user:) }

  before do
    user.add_role :owner, company
    sign_in user
    visit edit_settings_organization_path
  end

  context "when editing company phone number" do
    it "accepts valid US phone number" do
      fill_in "company_phone", with: "+14155552671"
      click_button "Save Changes"

      expect(page).to have_content("Company details updated successfully")
      expect(company.reload.business_phone).to eq("+14155552671")
    end

    it "accepts valid Indian phone number" do
      fill_in "company_phone", with: "+919876543210"
      click_button "Save Changes"

      expect(page).to have_content("Company details updated successfully")
      expect(company.reload.business_phone).to eq("+919876543210")
    end

    it "accepts valid UK phone number" do
      fill_in "company_phone", with: "+442071234567"
      click_button "Save Changes"

      expect(page).to have_content("Company details updated successfully")
      expect(company.reload.business_phone).to eq("+442071234567")
    end

    it "rejects invalid phone number" do
      fill_in "company_phone", with: "123"
      click_button "Save Changes"

      expect(page).to have_content("Please enter a valid business phone number")
    end

    it "rejects phone number exceeding 15 characters" do
      fill_in "company_phone", with: "+1234567890123456"
      click_button "Save Changes"

      expect(page).to have_content("Maximum 15 characters are allowed")
    end

    it "allows blank phone number" do
      fill_in "company_phone", with: ""
      click_button "Save Changes"

      expect(page).to have_content("Company details updated successfully")
      expect(company.reload.business_phone).to be_nil
    end
  end
end
