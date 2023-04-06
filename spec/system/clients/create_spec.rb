# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Create client", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:existing_client) { create(:client_with_phone_number_without_country_code, company:) }
  let(:client) { build(:client_with_phone_number_without_country_code, company:) }
  let(:address) { build(:address, :with_company) }

  def select_values_from_select_box
    within("div#country") do
      find(".react-select-filter__control.css-digfch-control").click
      find("#react-select-2-option-232").click
    end

    within("div#state") do
      find(".react-select-filter__control.css-digfch-control").click
      find("#react-select-3-option-1").click
    end

    within("div#city") do
      find(".react-select-filter__control.css-digfch-control").click
      fill_in "react-select-4-input", with: "Skita"
      find("#react-select-4-option-0").click
    end
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
          click_button "NEW CLIENT"
          find(
            "form input[type='file']",
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "test-image.png")
          )
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

          click_button "NEW CLIENT"
          fill_in "phone", with: client.phone
          fill_in "address1", with: address.address_line_1

          select_values_from_select_box

          fill_in "zipcode", with: address.pin
          click_button "SAVE CHANGES"

          expect(page).to have_content("Name cannot be blank")
          expect(page).to have_content("Email ID cannot be blank")
        end
      end

      it "throws error when using email of an existing client" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          fill_in "name", with: client.name
          fill_in "email", with: existing_client.email
          fill_in "phone", with: client.phone
          fill_in "address1", with: address.address_line_1

          select_values_from_select_box

          fill_in "zipcode", with: address.pin
          click_button "SAVE CHANGES"

          sleep(1)
          expect(page).to have_content("Email has already been taken")
        end
      end

      it "displays message for unsupported image format" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          find(
            "form input[type='file']",
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "pdf-file.pdf")
          )

          expect(page).to have_content("Incorrect file format. Please upload an image of type PNG or JPG.")
          expect(page).to have_content("Max size (30kb)")
        end
      end

      it "displays message when uploading logo larger than the max. size allowed" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          find(
            "form input[type='file']",
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "invalid-file.png")
          )

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

        expect(page).to have_no_button("NEW CLIENT")
      end
    end
  end
end
