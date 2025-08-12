# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Basic System Test", type: :system do
  it "can visit the login page and loads React app" do
    visit "/login"
    wait_for_page_load

    # Check if we're on the login page
    expect(page).to have_current_path("/login")

    # Check if React app loaded
    expect(page).to have_css('[data-testid="app-root"]')
    # Changed from App to AuthApp after Auth.js integration
    expect(page).to have_css('[data-component="AuthApp"]', wait: 10)
  end

  it "shows content on the home page with React loaded" do
    visit "/"
    wait_for_page_load

    # Check if React app is loaded
    expect(page).to have_css('[data-testid="app-root"]')
    expect(page).to have_css('[data-component="AuthApp"]')

    # Check if page contains Miru branding
    expect(page.html).to include("Miru")
  end
end
