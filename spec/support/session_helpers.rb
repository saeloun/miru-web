# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    # Use Warden test helpers for faster system tests
    login_as(user, scope: :user)
  end

  def sign_in_via_form(user)
    with_forgery_protection do
      visit "/login"

      # Wait for any form to load
      expect(page).to have_css("form", wait: 5)

      # Try different possible field names
      if page.has_field?("email")
        fill_in "email", with: user.email
        fill_in "password", with: user.password
      elsif page.has_field?("user[email]")
        fill_in "user[email]", with: user.email
        fill_in "user[password]", with: user.password
      elsif page.has_field?("user_email")
        fill_in "user_email", with: user.email
        fill_in "user_password", with: user.password
      end

      # Click the submit button
      click_button class: "btn"

      # Wait for redirect after login
      expect(page).to have_current_path("/", wait: 5)
    end
  end
end
