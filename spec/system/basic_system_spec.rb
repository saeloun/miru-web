# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Basic System Test", type: :system do
  it "can visit the login page" do
    visit "/login"

    # Check if we can see the page
    expect(page).to have_current_path("/login")
  end

  it "shows content on the home page" do
    visit "/"

    # Check if page loads - it should have something in the body
    expect(page.html).to include("Miru")
  end
end
