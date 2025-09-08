# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reset Password", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when visits reset password page" do
    it "allows user to reset password" do
      with_forgery_protection do
        user.send_reset_password_instructions
        token = user.send(:set_reset_password_token)

        expect(ActionMailer::Base.deliveries.last.subject).to eq("Reset your Miru password")
        expect(ActionMailer::Base.deliveries.last.to.first).to eq(user.email)

        visit edit_user_password_path(reset_password_token: token)

        fill_in "password", with: "Welcome@123"
        fill_in "confirm_password", with: "Welcome@123"
        click_on "Reset password"

        sleep 1
        expect(ActionMailer::Base.deliveries.last.subject).to eq("Miru Password Reset Successfully!")
        expect(ActionMailer::Base.deliveries.last.to.first).to eq(user.email)
      end
    end
  end

  context "when the token is invalid" do
    it "displays an error message when the token is invalid" do
      with_forgery_protection do
        visit edit_user_password_path(reset_password_token: "invalid_token")

        fill_in "password", with: "Welcome@123"
        fill_in "confirm_password", with: "Welcome@123"

        click_on "Reset password"

        expect(page).to have_text("Reset password token is invalid")
      end
    end
  end
end
