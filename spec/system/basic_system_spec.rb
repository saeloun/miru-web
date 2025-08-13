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
end
