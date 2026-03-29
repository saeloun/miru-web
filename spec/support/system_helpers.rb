# frozen_string_literal: true

module SystemHelpers
  # Wait for page to be ready (with or without React)
  def wait_for_page_ready
    # Wait for basic page load
    expect(page).to have_css("body", wait: 10)

    # Give JavaScript time to initialize if present
    sleep(1)

    # Try to wait for React, but don't fail if it's not there
    page.has_css?('[data-testid="app-loaded"]', wait: 2)
  end

  # Sign in and wait for dashboard
  def sign_in_and_visit(user, path = "/")
    sign_in(user)
    visit path
    wait_for_page_ready
  end

  # Helper to check if element is present without failing
  def element_present?(selector, wait: 5)
    page.has_css?(selector, wait: wait)
  end

  # Helper to safely click on elements that might need React
  def safe_click(text_or_selector)
    wait_for_page_ready

    if text_or_selector.start_with?("[", ".", "#")
      find(text_or_selector).click
    else
      click_on text_or_selector
    end
  rescue Capybara::ElementNotFound
    # If element not found, wait a bit more and try again
    sleep(2)
    if text_or_selector.start_with?("[", ".", "#")
      find(text_or_selector).click
    else
      click_on text_or_selector
    end
  end

  # Helper to fill in form fields safely
  def safe_fill_in(field, with:)
    wait_for_page_ready
    fill_in field, with: with
  rescue Capybara::ElementNotFound
    # Try with a different selector strategy
    find_field(field).set(with)
  end
end

RSpec.configure do |config|
  config.include SystemHelpers, type: :system
end
