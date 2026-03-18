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
      click_button "Send password reset link"

      expect(page).to have_text("Password reset link sent")
      expect(page).to have_text(user.email)
    end
  end
end
