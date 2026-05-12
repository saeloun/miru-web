# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Company Phone Number Validation", :js, type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company:, user:) }

  before do
    user.add_role :owner, company
    sign_in user
    visit "/settings/organization/edit"
  end

  context "when editing company phone number" do
    it "accepts valid US phone number" do
      fill_in "company_phone", with: "+14155552671"
      click_button "save changes"

      expect(page).to have_content("Changes saved successfully")
      expect(company.reload.business_phone).to eq("+14155552671")
    end

    it "accepts valid Indian phone number" do
      fill_in "company_phone", with: "+919876543210"
      click_button "save changes"

      expect(page).to have_content("Changes saved successfully")
      expect(company.reload.business_phone).to eq("+919876543210")
    end

    it "accepts valid UK phone number" do
      fill_in "company_phone", with: "+442071234567"
      click_button "save changes"

      expect(page).to have_content("Changes saved successfully")
      expect(company.reload.business_phone).to eq("+442071234567")
    end

    it "rejects invalid phone number" do
      fill_in "company_phone", with: "123"
      click_button "save changes"

      expect(page).to have_content("Please enter a valid business phone number")
    end

    it "rejects phone number exceeding 15 digits" do
      fill_in "company_phone", with: "+1234567890123456"

      expect(find_field("company_phone").value.gsub(/\D/, "").length).to be <= 15
    end

    it "rejects invalid Indian phone number" do
      fill_in "company_phone", with: "+9198765432101"
      click_button "save changes"

      expect(page).to have_content("Please enter a valid business phone number")
    end

    it "allows blank phone number" do
      fill_in "company_phone", with: ""
      click_button "save changes"

      expect(page).to have_content("Changes saved successfully")
      expect(company.reload.business_phone).to be_blank
    end
  end
end
