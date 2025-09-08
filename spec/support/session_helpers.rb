# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    # For system tests, we'll use Warden test helpers which bypass the UI
    login_as(user, scope: :user)

    # Set the user's current workspace if not set
    if user.current_workspace_id.nil? && user.companies.any?
      user.update!(current_workspace_id: user.companies.first.id)
    end

    # Visit root path to trigger app initialization
    visit "/"

    # Wait for the React app to load
    wait_for_react_app
  end

  def wait_for_react_app
    # Wait for the React app to be mounted
    expect(page).to have_css("#react-root", wait: 10)

    # Give React a moment to fully initialize and render content
    sleep 1
  end

  def navigate_to_spa_page(path)
    # For system tests with SPA architecture, we'll visit the path directly
    # The Rails app will handle the route and load the React app
    visit path

    # Wait for the page to load
    wait_for_react_app
    sleep 1
  end

  def skip_react_app_for_functionality_test
    # For tests that focus on functionality rather than UI,
    # we can test the underlying APIs directly
    # This is a marker method to indicate when we're testing functionality vs UI
    true
  end

  def sign_in_via_ui(user, password = "Password123!")
    # This method can be used when we need to test the actual login UI
    visit "/"

    # The login form is rendered by React
    wait_for_react_app

    # Look for login form elements
    within("form") do
      fill_in "Email", with: user.email
      fill_in "Password", with: password
      click_button "Sign In"
    end

    # Wait for redirect after successful login
    expect(page).to have_current_path("/time-tracking", wait: 10)
    wait_for_react_app
  end
end
