# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Create company", type: :system do
  let(:user) { create(:user, current_workspace: nil) }
  let(:company) { build(:company ) }
  let(:address) { build(:address, :with_company, country: "US", state: "Alabama", city: "Brooklyn" ) }

  context "when new user sign in" do
    before do
      sign_in(user)
    end

    context "when creating a company and address with valid values" do
      it "when creating companies with valid values" do
        find(
          'form input[type="file"]',
          visible: false).set(Rails.root.join("spec", "support", "fixtures", "test-image.png"))
        fill_in "company_name", with: company.name
        fill_in "address_line_1", with: address.address_line_1
        fill_in "business_phone", with: company.business_phone
        fill_in "react-select-2-input", with: address.country
        fill_in "react-select-3-input", with: address.state
        fill_in "react-select-4-input", with: address.city
        fill_in "zipcode", with: address.pin
        click_button "Next",  disabled: true
        # expect(page).to have_css('img#logo[src*="test-image.png"]')

        fill_in "react-select-2-input", with: company.base_currency
        # fill_in "standard_rate", with: "#{company.standard_price}"
        fill_in "react-select-3-input", with: company.fiscal_year_end

        fill_in "react-select-4-input", with: company.date_format
        find('button.form__button').click
        # expect(page).to have_current_path("/signup/success")
        # expect(page).to have_content(company.name)
      end
    end

    context "when creating a company and address with invalid values" do
      it "throws error when company name is blank" do
        with_forgery_protection do
          visit "/home/index"
          find(
              'form input[type="file"]',
              visible: false).set(Rails.root.join("spec", "support", "fixtures", "test-image.png"))
          fill_in "business_phone", with: company.business_phone
          fill_in "react-select-2-input", with: address.country
          fill_in "react-select-3-input", with: address.state
          fill_in "react-select-4-input", with: address.city
          fill_in "zipcode", with: address.pin
          click_button "Next",  disabled: true

          expect(page).to have_content("Company name can not be blank")
        end
      end

      it "displays message for unsupported image format" do
        with_forgery_protection do
          visit "/home/index"

          find(
            'form input[type="file"]',
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "pdf-file.pdf"))

          # expect(page).to have_content("Incorrect file format. Please upload an image of type PNG or JPG.")
          # expect(page).to have_content("Max size (30kb)")
        end
      end

      it "displays message when uploading logo larger than the max. size allowed" do
        with_forgery_protection do
          visit "/home/index"

          find(
            'form input[type="file"]',
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "invalid-file.png"))

          # expect(page).to have_content("File size exceeded the max limit of 30KB.")
        end
      end
    end
  end
end
