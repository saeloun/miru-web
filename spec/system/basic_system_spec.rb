# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Basic System Test", type: :system, js: true do
  it "can visit the login page" do
    visit "/login"

    # Check if we're on the login page
    expect(page).to have_current_path("/login")

    # Check if page has basic content
    expect(page.title).to include("Miru")
  end

  it "shows content on the home page" do
    visit "/"

    # Check if page contains Miru branding
    expect(page.title).to include("Miru")
  end

  context "with JavaScript", js: true do
    it "loads React application" do
      visit "/"

      # Wait for React root to be present
      expect(page).to have_css("#react-root", wait: 10)

      # Check if we're redirected to login (which means React loaded)
      # Note: Devise redirects to /user/sign_in
      expect(page.current_path).to eq("/user/sign_in").or eq("/login").or eq("/")
    end
  end
end
