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

        click_on "Sign In"

        expect(page).to have_current_path("/time-tracking")
      end
    end

    it "displays an error message with invalid credentials" do
      with_forgery_protection do
        visit "/login"

        fill_in "email", with: "invalid@example.com"
        fill_in "password", with: "password"

        click_on "Sign In"

        expect(page).to have_current_path("/user/sign_in")
        expect(page).to have_text("Invalid email or password")
      end
    end

    it "displays an error message if the user's account is unconfirmed" do
      user = create(:user, confirmed_at: nil)

      with_forgery_protection do
        visit "/login"

        fill_in "email", with: user.email
        fill_in "password", with: user.password

        click_on "Sign In"

        expect(page).to have_current_path("/email_confirmation?email=#{user.email}")
        expect(page).to have_text("You have to confirm your email address before continuing.")
      end
    end
  end
end
