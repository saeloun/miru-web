# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Create client", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:existing_client) { create(:client_with_phone_number_without_country_code, company:) }
  let(:client) { build(:client_with_phone_number_without_country_code, company:) }
  let(:address) { build(:address, :with_company) }

  def select_values_from_select_box
    within("div#country") do
      find(".react-select-filter__control").click
      find("div[id^='react-select'][id$='option-232']").click
    end

    within("div#state") do
      find(".react-select-filter__control").click
      find("div[id^='react-select'][id$='option-1']").click
    end

    within("div#city-list") do
      find(".react-select-filter__control").click
      find("div[id^='react-select'][id$='option-0']").click
    end
  end

  def upload_test_image(file_name)
    find(
      "form input[type='file']",
      visible: false).set(Rails.root.join("spec", "support", "fixtures", file_name)
    )
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in(user)
    end

    context "when creating clients with valid values" do
      it "creates the client successfully" do
        with_forgery_protection do
          visit "/clients"
          
          # Wait for React app to load
          expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

          click_button "Add Clients"
          upload_test_image("test-image.png")
          fill_in "name", with: client.name
          fill_in "email", with: client.email
          fill_in "phone", with: client.phone
          fill_in "address1", with: address.address_line_1
          select_values_from_select_box
          fill_in "zipcode", with: address.pin
          click_button "SAVE CHANGES"

          expect(page).to have_content(client.name)
        end
      end
    end

    context "when creating clients with invalid values" do
      it "throws error when leaving name and email blank" do
        with_forgery_protection do
          visit "/clients"
          
          # Wait for React app to load
          expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

          click_button "Add Clients"
          fill_in "phone", with: client.phone
          fill_in "address1", with: address.address_line_1
          select_values_from_select_box
          fill_in "zipcode", with: address.pin

          # Check that save button is disabled
          expect(page).to have_button("SAVE CHANGES", disabled: true)
        end
      end

      it "throws error when using email of an existing client" do
        with_forgery_protection do
          visit "/clients"
          
          # Wait for React app to load
          expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

          click_button "Add Clients"
          fill_in "name", with: client.name
          fill_in "email", with: existing_client.email
          fill_in "phone", with: client.phone
          fill_in "address1", with: address.address_line_1
          select_values_from_select_box
          fill_in "zipcode", with: address.pin
          click_button "SAVE CHANGES"

          expect(page).to have_content("Email has already been taken", wait: 5)
        end
      end

      it "displays message for unsupported image format" do
        with_forgery_protection do
          visit "/clients"
          
          # Wait for React app to load
          expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

          click_button "Add Clients"

          upload_test_image("pdf-file.pdf")

          expect(page).to have_content("Accepted file formats: PNG and JPG.")
        end
      end

      it "displays message when uploading logo larger than the max. size allowed" do
        with_forgery_protection do
          visit "/clients"
          
          # Wait for React app to load
          expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

          click_button "Add Clients"
          upload_test_image("invalid-file.png")

          expect(page).to have_content("File size exceeded the max limit of 30KB.")
        end
      end
    end
  end

  context "when user is employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in(user)
    end

    it "add new client button should not be visible" do
      with_forgery_protection do
        visit "/clients"
        
        # Wait for React app to load
        expect(page).to have_selector('[data-testid="app-loaded"]', wait: 10)

        expect(page).to have_no_button("NEW CLIENT")
      end
    end
  end
end