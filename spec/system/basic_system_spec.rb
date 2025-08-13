# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Basic System Test", type: :system do
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

      # This will be automatically marked as pending if React doesn't load
      # due to the before hook in react_pending_helper.rb
      expect(page).to have_css('[data-testid="app-loaded"]', wait: 10)
    end
  end
end
