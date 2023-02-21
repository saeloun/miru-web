# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User Signup", type: :system do
  let(:user) { build(:user) }
  let(:existing_user) { create(:user) }

  context "when signing up with a new email" do
    it "allows a user to sign up for the website" do
      visit new_user_registration_path

      within("#new_user") do
        fill_in "First Name", with: user.first_name
        fill_in "Last Name", with: user.last_name
        fill_in "Email", with: user.email
        fill_in "Password", with: user.password
        fill_in "Confirm Password", with: user.password
      end
      click_button "SIGN UP"

      expect(ActionMailer::Base.deliveries.count).to eq(1)
      expect(ActionMailer::Base.deliveries.first.subject).to eq("Confirmation instructions")
    end

    it "allows to verify their email" do
      visit new_user_registration_path

      within("#new_user") do
        fill_in "First Name", with: user.first_name
        fill_in "Last Name", with: user.last_name
        fill_in "Email", with: user.email
        fill_in "Password", with: user.password
        fill_in "Confirm Password", with: user.password
      end
      click_button "SIGN UP"

      email_body = ActionMailer::Base.deliveries.first.body.to_s
      confirmation_token = email_body.match(/confirmation_token=([\w-]+)/)[1]

      visit user_confirmation_path(confirmation_token:)

      expect(page).to have_content "Your email address has been successfully confirmed."
    end
  end

  context "when attempting to sign up with an existing email" do
    it "throws an error when using already registered email" do
      visit new_user_registration_path

      within("#new_user") do
        fill_in "First Name", with: user.first_name
        fill_in "Last Name", with: user.last_name
        fill_in "Email", with: existing_user.email
        fill_in "Password", with: user.password
        fill_in "Confirm Password", with: user.password
      end
      click_button "SIGN UP"

      expect(page).to have_content "Email ID already exists"
    end
  end

  context "when signing up with a new account and password confirmation mismatches" do
    it "displays an error message when password confirmation doesn't match new password" do
      visit new_user_registration_path

      within("#new_user") do
        fill_in "First Name", with: user.first_name
        fill_in "Last Name", with: user.last_name
        fill_in "Email", with: user.email
        fill_in "Password", with: "testing123"
        fill_in "Confirm Password", with: "testing345"
      end
      click_button "SIGN UP"

      expect(page).to have_content "doesn't match with new password"
    end
  end
end
