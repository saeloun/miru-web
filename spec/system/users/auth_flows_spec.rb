# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth flows", type: :system, js: true do
  it "allows a visitor to sign up and reach email verification" do
    with_forgery_protection do
      visit "/signup"

      fill_in "first_name", with: "Alex"
      fill_in "last_name", with: "Founder"
      fill_in "email", with: "alex.#{SecureRandom.hex(4)}@example.com"
      fill_in "password", with: "Password1!"
      fill_in "confirm_password", with: "Password1!"

      find("#termsOfService", visible: :all).check
      click_button "Create account"

      expect(page).to have_current_path(/\/email_confirmation/)
      expect(page).to have_text("Email Verification")
      expect(page).to have_text("Verification link has been sent")
    end
  end

  it "allows a visitor to request a password reset link" do
    user = create(:user)

    with_forgery_protection do
      visit "/password/new"

      fill_in "email", with: user.email
      click_button "Send Reset Link"

      expect(page).to have_text("Password reset link sent")
      expect(page).to have_text(user.email)
    end
  end

  it "accepts an invitation and opens the reset password screen for a new user" do
    company = create(:company)
    invitation = create(:invitation, company:)

    with_forgery_protection do
      visit invitations_accepts_path(token: invitation.token)

      expect(page).to have_current_path(/\/users\/password\/edit\?reset_password_token=/)
      expect(page).to have_text("Reset Password")
      fill_in "password", with: "Password1!"
      fill_in "confirm_password", with: "Password1!"
      click_button "Reset Password"

      expect(page).to have_current_path("/").or have_current_path("/dashboard").or have_current_path("/time-tracking")
    end
  end

  it "shows the support alias in privacy and terms modals" do
    with_forgery_protection do
      visit "/signup"

      click_on "Privacy"
      expect(page).to have_link("hello@saeloun.com", href: "mailto:hello@saeloun.com", wait: 10)

      find("body").send_keys(:escape)
      click_on "Terms"
      expect(page).to have_link("hello@saeloun.com", href: "mailto:hello@saeloun.com", wait: 10)
    end
  end
end
