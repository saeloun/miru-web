# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Forgot Password", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when visits forgot password page" do
    it "sends a password reset email when given a valid email address" do
      with_forgery_protection do
        visit "/password/new"

        fill_in "email", with: user.email

        click_on "Send password reset link"

        sleep 1

        expect(ActionMailer::Base.deliveries.last.to).to eq [user.email]
        expect(ActionMailer::Base.deliveries.last.subject).to eq "Reset your Miru password"
      end
    end

    it "does not send a password reset email when given an invalid email address" do
      with_forgery_protection do
        visit "/password/new"

        fill_in "email", with: "invalid-email@example.com"

        click_on "Send password reset link"

        expect(page).to have_text("Email not found")

        expect(ActionMailer::Base.deliveries).to be_empty
      end
    end
  end
end
