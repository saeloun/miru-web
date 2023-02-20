# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Forgot password", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  before do
    create(:employment, company:, user:)
  end

  context "when user submits their email address" do
    before do
      visit new_user_password_path
      within("#new_user") do
        fill_in "user_email", with: user.email
      end
      click_on "SEND PASSWORD RESET LINK"
      @reset_password_token = ActionMailer::Base.deliveries.first.body.to_s.match(/reset_password_token=([\w-]+)/)[1]
    end

    it "sends a password reset email" do
      expect(ActionMailer::Base.deliveries.count).to eq(1)
      expect(ActionMailer::Base.deliveries.first.subject).to eq("Reset your Miru password")
    end

    it "allows user to reset password" do
      visit edit_user_password_path(reset_password_token: @reset_password_token)

      expect(page).to have_selector("h2", text: "Reset Password")
      within("#new_user") do
        fill_in "New Password", with: "new_password"
        fill_in "Confirm Password", with: "new_password"
      end
      click_on "SET PASSWORD"

      expect(page).to have_content("Your password has been changed successfully. You are now signed in.")
    end

    it "sends an email after password reset" do
      visit edit_user_password_path(reset_password_token: @reset_password_token)

      within("#new_user") do
        fill_in "New Password", with: "new_password"
        fill_in "Confirm Password", with: "new_password"
      end
      click_on "SET PASSWORD"

      expect(ActionMailer::Base.deliveries.count).to eq(2)
      expect(ActionMailer::Base.deliveries.last.subject).to eq("Miru Password Reset Successfully!")
      expect(ActionMailer::Base.deliveries.last.to.first).to eq(user.email)
    end
  end

  context "when user enters an email that is not registered" do
    before do
      visit new_user_password_path

      within("#new_user") do
        fill_in "user_email", with: "unknown_email@example.com"
      end
      click_on "SEND PASSWORD RESET LINK"
    end

    it "displays an error message" do
      expect(ActionMailer::Base.deliveries.count).to eq(0)
      expect(page).to have_content("Email not found")
    end
  end
end
