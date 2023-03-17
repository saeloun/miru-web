# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User Signup", type: :system do
  let(:user) { build(:user, password: "Welcome@123") }
  let(:existing_user) { create(:user) }

  context "when signing up with a new email" do
    it "allows a user to sign up for the website" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: user.email
        fill_in "password", with: user.password
        fill_in "confirm_password", with: user.password

        click_on "Sign Up"

        expect(page).to have_content("Email Verification")
        expect(page).to have_content(user.email)
      end
    end

    it "allows to verify their email" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: user.email
        fill_in "password", with: user.password
        fill_in "confirm_password", with: user.password

        click_on "Sign Up"

        expect(page).to have_content("Email Verification")
        expect(page).to have_content(user.email)

        email_body = ActionMailer::Base.deliveries.first.body.to_s
        confirmation_token = email_body.match(/confirmation_token=([\w-]+)/)[1]

        visit user_confirmation_path(confirmation_token:)

        expect(page).to have_content "Welcome"
      end
    end
  end

  context "when attempting to sign up with an existing email" do
    it "throws an error when using already registered email" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: user.password
        fill_in "confirm_password", with: user.password

        click_on "Sign Up"

        expect(page).to have_content "Email ID already exists"
      end
    end
  end
end
