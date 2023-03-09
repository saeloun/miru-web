# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Create client", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:existing_client) { create(:client_with_phone_number_without_country_code, company:) }
  let(:client) { build(:client_with_phone_number_without_country_code, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      login_as(user)
    end

    context "when creating clients with valid values" do
      it "creates the client successfully" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          find(
            'form input[type="file"]',
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "test-image.png"))
          fill_in "name", with: client.name
          fill_in "email", with: client.email
          fill_in "phone", with: client.phone
          fill_in "address", with: client.address
          click_button "SAVE CHANGES"

          expect(page).to have_css('img#logo[src*="test-image.png"]')
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
          fill_in "address", with: client.address
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
          fill_in "address", with: client.address
          click_button "SAVE CHANGES"

          expect(page).to have_content("Email has already been taken")
        end
      end

      it "displays message for unsupported image format" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          find(
            'form input[type="file"]',
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "pdf-file.pdf"))

          expect(page).to have_content(
            "Incorrect file format.
            Please upload an image of type PNG or JPG. Max size (30kb)")
        end
      end

      it "displays message when uploading logo larger than the max. size allowed" do
        with_forgery_protection do
          visit "/clients"

          click_button "NEW CLIENT"
          find(
            'form input[type="file"]',
            visible: false).set(Rails.root.join("spec", "support", "fixtures", "invalid-file.png"))

          expect(page).to have_content("File size exceeded the max limit of 30KB.")
        end
      end
    end
  end

  context "when user is employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      login_as(user)
    end

    it "add new client button should not be visible" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_no_button("NEW CLIENT")
      end
    end
  end
end
