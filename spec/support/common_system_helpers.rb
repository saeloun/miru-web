# frozen_string_literal: true

module CommonSystemHelpers
  # Wait for React app to be fully loaded
  def wait_for_react_app
    expect(page).to have_css("#react-root", wait: 10)
    sleep 0.5 # Give React time to hydrate
  end

  # Enhanced sign in with proper waits
  def sign_in_and_navigate(user, path = nil)
    sign_in(user)

    if path
      visit path
      wait_for_react_app
    end
  end

  # Wait for page content to load
  def wait_for_content(text, timeout: 10)
    expect(page).to have_content(text, wait: timeout)
  end

  # Click element with retry logic
  def safe_click(selector_or_text, strategy: :auto)
    retries = 0
    max_retries = 3

    begin
      if strategy == :selector || (strategy == :auto && selector_or_text.start_with?(".", "#", "["))
        find(selector_or_text).click
      else
        click_on selector_or_text
      end
    rescue Capybara::ElementNotFound, Playwright::Error => e
      retries += 1
      if retries < max_retries
        sleep 1
        retry
      else
        raise e
      end
    end
  end

  # Fill form field with React compatibility
  def fill_in_react_field(field, with:)
    field_element = find_field(field)
    field_element.fill_in(with: with)
    field_element.native.send_keys(:tab) # Trigger React onChange
    sleep 0.1
  end

  # Select from React select component
  def select_react_option(container_selector, option_text)
    within(container_selector) do
      find(".react-select__control, .react-select-filter__control").click
      find(".react-select__option", text: option_text).click
    end
  end

  # Wait for modal to appear
  def wait_for_modal
    expect(page).to have_css("[role='dialog']", wait: 10)
  end

  # Close modal
  def close_modal
    within("[role='dialog']") do
      find("[aria-label='Close'], .close-button, button", text: "Cancel").click
    end
    expect(page).not_to have_css("[role='dialog']")
  end

  # Handle confirmation dialogs
  def confirm_action(confirm_text = "Confirm")
    wait_for_modal
    within("[role='dialog']") do
      click_button confirm_text
    end
  end

  # Check for toast/notification messages
  def expect_success_message(message = nil)
    if message
      expect(page).to have_content(message)
    else
      expect(page).to have_css(".toast-success, .alert-success, [role='status']", wait: 5)
    end
  end

  # Check for error messages
  def expect_error_message(message)
    expect(page).to have_content(message)
    expect(page).to have_css(".toast-error, .alert-danger, .error-message", wait: 5)
  end

  # Navigate using sidebar
  def navigate_via_sidebar(menu_item)
    # Open sidebar if mobile
    if page.has_css?(".mobile-menu-button", wait: 1)
      find(".mobile-menu-button").click
    end

    within("nav, .sidebar, [role='navigation']") do
      click_link menu_item
    end

    wait_for_react_app
  end

  # Helper for debugging
  def debug_page
    puts "Current URL: #{page.current_url}"
    puts "Page title: #{page.title}"
    puts "Visible text: #{page.text[0..500]}"
    save_screenshot("tmp/debug_#{Time.now.to_i}.png")
  end
end

RSpec.configure do |config|
  config.include CommonSystemHelpers, type: :system
end
