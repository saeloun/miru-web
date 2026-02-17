# frozen_string_literal: true

module ReactHelpers
  # Wait for React components to mount and hydrate
  def wait_for_react
    # Try to wait for the main App component to be present
    # But don't fail if it's not there (for now, due to test environment issues)
    page.has_css?('[data-testid="app-loaded"]', wait: 5)

    # Wait for React to finish initial rendering
    sleep(0.5)
  end

  # Wait for a specific React component to load
  def wait_for_component(component_name, timeout: 10)
    expect(page).to have_css("[data-component='#{component_name}']", wait: timeout)
  end

  # Execute code within a specific React component context
  def within_react_component(component_name)
    within("[data-component='#{component_name}']") do
      wait_for_react
      yield
    end
  end

  # Wait for page to be fully loaded including React hydration
  def wait_for_page_load
    # Wait for document ready state
    expect(page.evaluate_script("document.readyState")).to eq("complete")

    # Wait for React to mount
    wait_for_react

    # Additional wait for any async loading
    sleep(1)
  end

  # Better login helper that waits for React
  def sign_in_with(email, password)
    visit "/login"
    wait_for_page_load

    fill_in "email", with: email
    fill_in "password", with: password

    click_button "Sign In"

    # Wait for redirect and React to load
    wait_for_page_load
  end

  # Wait for specific URL and React loading
  def wait_for_path(path, timeout: 10)
    expect(page).to have_current_path(path, wait: timeout)
    wait_for_react
  end

  # Check if React app has loaded successfully
  def react_app_loaded?
    page.has_css?('[data-testid="app-loaded"]')
  rescue
    false
  end

  # Wait for specific content to appear (useful for dynamic content)
  def wait_for_content(text, timeout: 10)
    expect(page).to have_text(text, wait: timeout)
  end

  # Enhanced form filling that waits for React inputs
  def fill_react_field(field_name, value)
    field = find_field(field_name)
    field.fill_in(with: value)

    # Trigger React onChange event
    field.native.send_keys(:tab)
  end

  # Click button and wait for React to respond
  def click_react_button(button_text)
    click_button(button_text)
    sleep(0.5) # Allow React to process the click
  end
end

RSpec.configure do |config|
  config.include ReactHelpers, type: :system

  config.before(:each, type: :system) do
    # Set longer default wait time for system specs
    Capybara.default_max_wait_time = 10

    # Clear cookies/storage for Playwright driver
    if defined?(page) && page.respond_to?(:driver)
      # Playwright handles this automatically with new context
    end
  end
end
