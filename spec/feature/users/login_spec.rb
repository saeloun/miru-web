# frozen_string_literal: true

require "rails_helper"

describe "User Sign In", type: :feature do
  before do
    let(:user) { create(:user, password: "password", password_confirmation: "password") }
  end

  context "when using valid credentials" do
    it "logs user in" do
      visit "/users/sign_in"
      within("#new_user") do
        fill_in "Email", with: user.email
        fill_in "Password", with: "password"
      end

      click_button "SIGN IN"

      expect(page).to have_content "Success"
    end
  end
end
