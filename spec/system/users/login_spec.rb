# frozen_string_literal: true

require "rails_helper"

describe "User Sign In", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "testing!") }

  context "when user is an admin, owner, employee" do
    before do
      create(:employment, company:, user:)
    end

    context "when using valid credentials" do
      it "logs user in" do
        visit "/users/sign_in"

        within("#new_user") do
          fill_in "Email", with: user.email
          fill_in "Password", with: "testing!"
        end
        click_button "SIGN IN"

        expect(page).to have_content "Signed in successfully."
      end
    end

    context "when using invalid credentials" do
      it "throws an error" do
        visit "/users/sign_in"

        within("#new_user") do
          fill_in "Email", with: user.email
          fill_in "Password", with: "testing123"
        end
        click_button "SIGN IN"

        expect(page).to have_content "Invalid Email or password."
      end
    end
  end
end
