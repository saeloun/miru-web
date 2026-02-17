# frozen_string_literal: true

# Comprehensive system test helpers for Miru 2.0
module SystemTestHelpers
  # Enhanced sign in that ensures proper authentication
  def sign_in(user)
    # Ensure user has required associations
    ensure_user_setup(user)

    # Use Warden test helpers for authentication
    login_as(user, scope: :user)

    # Visit home to trigger app initialization
    visit root_path

    # Wait for React app to load
    wait_for_app_initialization
  end

  # Ensure user has all required data
  def ensure_user_setup(user)
    # Ensure user has a current workspace
    if user.current_workspace_id.nil?
      company = user.companies.first || create(:company)
      user.update!(current_workspace_id: company.id)

      # Ensure employment exists
      unless user.employments.exists?(company: company)
        create(:employment, user: user, company: company)
      end

      # Ensure user has appropriate role
      unless user.has_any_role?(:admin, :owner, :employee, :book_keeper)
        user.add_role(:employee, company)
      end
    end

    # Ensure user is confirmed
    user.confirm unless user.confirmed?
  end

  # Wait for React app to be fully initialized
  def wait_for_app_initialization
    # Wait for React root to be present
    expect(page).to have_css("#react-root, [data-testid='app-root'], [data-testid='app-loaded']", wait: 10)

    # Give React time to fully hydrate
    sleep 0.5

    # Check if we're on the expected page (usually time-tracking after login)
    if page.current_path == "/"
      # We should be redirected to time-tracking
      expect(page).to have_current_path("/time-tracking", wait: 10)
    end
  end

  # Navigate to a page and wait for it to load
  def visit_and_wait(path)
    visit path
    wait_for_app_initialization
  end

  # Fill in a form field with React event handling
  def fill_in_react(field, with:)
    field_element = find_field(field)
    field_element.fill_in(with: with)

    # Trigger React events
    field_element.native.send_keys(:tab)
    sleep 0.1
  end

  # Click and wait for React to process
  def click_and_wait(text_or_selector)
    if text_or_selector.start_with?("[", ".", "#")
      find(text_or_selector).click
    else
      click_on text_or_selector
    end
    sleep 0.5
  end

  # Wait for specific content to appear
  def wait_for_content(text, timeout: 10)
    expect(page).to have_content(text, wait: timeout)
  end

  # Check if we're on the login page (not authenticated)
  def on_login_page?
    page.current_path == "/login" ||
    page.current_path == "/" && page.has_content?("Sign In", wait: 2)
  end

  # Sign up a new user through the UI
  def sign_up_user(first_name:, last_name:, email:, password:)
    visit "/signup"
    wait_for_app_initialization

    within("form") do
      fill_in "first_name", with: first_name
      fill_in "last_name", with: last_name
      fill_in "email", with: email
      fill_in "password", with: password
      fill_in "confirm_password", with: password

      # Accept terms of service
      find(:css, "#termsOfService", visible: false).set(true)

      click_button "Sign Up"
    end

    # Wait for redirect or confirmation
    sleep 1
  end

  # Helper for invoice-specific navigation
  def navigate_to_invoices
    sign_in(@user) if @user && !page.has_css?("#react-root", wait: 1)
    visit "/invoices"
    wait_for_content("Invoices", timeout: 10)
  end

  # Helper for time tracking navigation
  def navigate_to_time_tracking
    sign_in(@user) if @user && !page.has_css?("#react-root", wait: 1)
    visit "/time-tracking"
    wait_for_content("Time Tracking", timeout: 10)
  end
end

# Include in all system specs
RSpec.configure do |config|
  config.include SystemTestHelpers, type: :system
  config.include Warden::Test::Helpers, type: :system

  config.before(:each, type: :system) do
    # Set up Capybara
    Capybara.default_max_wait_time = 10

    # Reset Warden
    Warden.test_reset!
  end

  config.after(:each, type: :system) do
    # Clean up after each test
    Warden.test_reset!
  end
end
