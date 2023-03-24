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

    it "allows a user to sign up with a password containing hyphens as special characters" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: user.email
        fill_in "password", with: "wohXyq-cusgoz-fexde0"
        fill_in "confirm_password", with: "wohXyq-cusgoz-fexde0"

        click_on "Sign Up"

        expect(page).to have_content("Email Verification")
        expect(page).to have_content(user.email)
      end
    end

    it "allows a user to sign up with a password containing blank spaces in between" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: user.email
        fill_in "password", with: "My password with spaces@2023"
        fill_in "confirm_password", with: "My password with spaces@2023"

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

        expect(page).to have_content "Thanks for verifying your email."
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

  context "when attempting to sign up with invalid password" do
    it "throws an error when using password with less than 8 characters" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "Pass@1"
        fill_in "confirm_password", with: "Pass@1"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using password without at least one uppercase letter" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "password@2023"
        fill_in "confirm_password", with: "password@2023"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using password without at least one lowercase letter" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "PASSWORD@2023"
        fill_in "confirm_password", with: "PASSWORD@2023"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using password without at least one number" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "@Password"
        fill_in "confirm_password", with: "@Password"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using password without at least one special character" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "Password2023"
        fill_in "confirm_password", with: "Password2023"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using a password with spaces as special characters" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "Password 2023"
        fill_in "confirm_password", with: "Password 2023"

        click_on "Sign Up"

        expect(page).to have_content "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      end
    end

    it "throws an error when using a password that starts with blank space" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: " Password@2023"
        fill_in "confirm_password", with: " Password@2023"

        click_on "Sign Up"

        expect(page).to have_content "Password can not start or end with a blank space"
      end
    end

    it "throws an error when using a password that ends with blank space" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "Password@2023 "
        fill_in "confirm_password", with: "Password@2023 "

        click_on "Sign Up"

        expect(page).to have_content "Password can not start or end with a blank space"
      end
    end

    it "throws an error when password and confirm password do not match" do
      with_forgery_protection do
        visit "/signup"

        fill_in "firstName", with: user.first_name
        fill_in "lastName", with: user.last_name
        fill_in "email", with: existing_user.email
        fill_in "password", with: "Welcome@123"
        fill_in "confirm_password", with: "HelloWorld@123"

        click_on "Sign Up"

        expect(page).to have_content "Passwords must match"
      end
    end
  end
end
