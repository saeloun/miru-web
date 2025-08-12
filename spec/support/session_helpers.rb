# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    # Try to use Warden helpers first, fall back to form if needed
    begin
      login_as(user, scope: :user)
      visit "/"

      # Check if login worked
      if page.has_css?('[data-testid="app-root"]', wait: 2)
        # Login successful
        return
      end
    rescue => e
      puts "Warden login failed: #{e.message}"
    end

    # Fall back to form-based login
    sign_in_via_form(user)
  end

  def sign_in_via_form(user)
    with_forgery_protection do
      visit "/login"

      # Wait for React app and login form to load
      expect(page).to have_css('[data-component="AuthApp"]', wait: 10)
      wait_for_react

      # Wait for the form to be ready
      expect(page).to have_css("form", wait: 5)
      expect(page).to have_field("email", wait: 5)
      expect(page).to have_field("password", wait: 5)

      # Set a known password for the user if needed
      password = "Test@Password123!"
      user.update!(password: password, password_confirmation: password)

      # Ensure the user has employment (required for active_for_authentication?)
      unless user.employments.exists?
        puts "WARNING: User has no employment! Creating one..."
        Employment.create!(
          user: user,
          company: user.current_workspace || Company.first,
          designation: "Developer",
          employment_type: "full_time",
          joined_at: Date.today
        )
      end

      # Fill in the form fields - Auth.js uses regular field names
      fill_in "email", with: user.email
      fill_in "password", with: password

      # Click the Sign In button
      click_button "Sign In"

      # Wait a moment for the form submission to process
      sleep 2

      # Check if there's an error message
      if page.has_content?("Invalid email or password", wait: 1)
        # If login failed, try to debug
        puts "Login failed for user: #{user.email}"
        puts "User confirmed: #{user.confirmed?}"
        puts "User active: #{user.active_for_authentication?}"

        # Take a screenshot for debugging
        page.save_screenshot("tmp/login_failure_debug.png")
      end

      # Wait for successful login and redirect
      # After Auth.js login, we are redirected to /time-tracking by default
      expect(page).to have_current_path("/time-tracking", wait: 10)

      # Ensure the app has loaded after login
      expect(page).to have_css('[data-component="AuthApp"]', wait: 10)
    end
  end
end
