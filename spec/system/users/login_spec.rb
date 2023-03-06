# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User Sign In", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when user is an admin, owner, employee" do
    before do
      create(:employment, company:, user:)
    end

    context "when using valid credentials" do
      it "logs user in" do
        with_forgery_protection do
          visit "/login"

          fill_in "email", with: user.email
          fill_in "password", with: "testing!"

          click_on "Sign In"
          expect(page).to have_content(I18n.t("devise.sessions.signed_in"))
        end
      end
    end

    context "when using invalid credentials" do
      it "throws an error" do
        with_forgery_protection do
          visit "/login"

          fill_in "email", with: user.email
          fill_in "password", with: "testing123"

          click_on "Sign In"
          expect(page).to have_content(I18n.t("sessions.failure.invalid"))
        end
      end
    end
  end
end
