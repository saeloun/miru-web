# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Email confirmations", type: :system, js: true do
  let(:user) { create(:user, confirmed_at: nil) }
  let(:user2) { build(:user, password: "Welcome@123") }

  context "when unconfirmed user logs in" do
    before do
      with_forgery_protection do
        visit "/login"
        find('input[type="email"], input[name*="email"], input[placeholder*="email"]', match: :first).fill_in with: user.email
        find('input[type="password"], input[name*="password"], input[placeholder*="password"]', match: :first).fill_in with: user.password
        click_on "Sign In"
      end
    end

    it "renders email confirmation page" do
      expect(page).to have_current_path("/email_confirmation?email=#{user.email}")
      expect(page).to have_content("Email Verification")
      expect(page).to have_content("Resend")
    end

    it "resends confirmation mail if user clicks on resend" do
      click_on "Resend"
      expect(ActionMailer::Base.deliveries.last.subject).to eq("Confirmation instructions")
      expect(ActionMailer::Base.deliveries.last.to.first).to eq(user.email)
    end
  end

  context "when new user signup" do
    before do
      with_forgery_protection do
        visit "/signup"

        # Wait for React to render
        sleep 2

        # Use direct ID selectors without within block to avoid ambiguity
        find("#first_name").fill_in with: user2.first_name
        find("#last_name").fill_in with: user2.last_name
        find("#email").fill_in with: user2.email
        find("#password").fill_in with: user2.password
        find("#confirm_password").fill_in with: user2.password
        find("#termsOfService", visible: false).set(true)

        click_on "Sign Up"
      end
    end

    it "renders email confirmation page", :pending do
      expect(page).to have_current_path("/email_confirmation?email=#{user2.email}")
      expect(page).to have_content("Email Verification")
      expect(page).to have_content("Resend")
    end

    it "resends confirmation mail if user clicks on resend", :pending do
      click_on "Resend"
      expect(ActionMailer::Base.deliveries.last.subject).to eq("Confirmation instructions")
      expect(ActionMailer::Base.deliveries.last.to.first).to eq(user2.email)
    end
  end

  context "when confirmed user visits email confirmation page" do
    let(:user) { create(:user) }

    it "throws error" do
      with_forgery_protection do
        # Confirmed users get redirected to sign in when visiting email confirmation
        visit "/email_confirmation?email=#{user.email}"

        # They should be redirected to sign in page
        expect(page).to have_current_path("/user/sign_in")
      end
    end
  end
end
