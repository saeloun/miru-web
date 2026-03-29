# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sign-in", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin, owner, employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    it "allows a user to sign in with valid credentials" do
      with_forgery_protection do
        visit "/login"

        fill_in "email", with: user.email
        fill_in "password", with: user.password

        click_on "Sign in"

        expect(page).to have_current_path("/dashboard").or have_current_path("/time-tracking").or have_current_path("/")
      end
    end

    it "displays an error message with invalid credentials" do
      with_forgery_protection do
        visit "/login"

        fill_in "email", with: "invalid@example.com"
        fill_in "password", with: "password"

        click_on "Sign in"

        expect(page).to have_current_path("/login")
        expect(page).to have_text("Invalid email or password")
      end
    end

    it "displays an error message if the user's account is unconfirmed" do
      user = create(:user, confirmed_at: nil)

      with_forgery_protection do
        visit "/login"

        fill_in "email", with: user.email
        fill_in "password", with: user.password

        click_on "Sign in"

        expect(page).to have_current_path("/email_confirmation?email=#{user.email}")
        expect(page).to have_text("You have to confirm your email address before continuing.")
      end
    end

    it "shows both Google and GitHub sign-in options" do
      with_forgery_protection do
        visit "/login"

        expect(page).to have_button("Continue with Google")
        expect(page).to have_button("Continue with GitHub")
      end
    end

    it "preserves dark mode on forgot password page" do
      with_forgery_protection do
        visit "/login"

        page.execute_script(<<~JS)
          localStorage.setItem("miru-theme", "dark");
          document.documentElement.classList.add("dark");
        JS
        click_link "Forgot password?"

        expect(page).to have_current_path("/password/new")
        expect(page).to have_button("Send password reset link")
        expect(page.evaluate_script("document.documentElement.classList.contains('dark')")).to be(true)
      end
    end

    it "signs in with an authenticator code when totp is enabled" do
      user.reset_totp_setup!
      setup_code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now
      user.verify_totp_code!(setup_code)
      user.update!(otp_required_for_login: true)
      user.generate_recovery_codes!

      with_forgery_protection do
        visit "/login"

        fill_in "email", with: user.email
        fill_in "password", with: user.password
        click_on "Sign in"

        expect(page).to have_content("Verify with your authenticator app", wait: 10)

        travel 31.seconds
        login_code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now
        fill_in "totp_code", with: login_code
        click_on "Verify and sign in"

        expect(page).to have_current_path("/dashboard").or have_current_path("/time-tracking").or have_current_path("/")
      end
    end
  end
end
