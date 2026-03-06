# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    Warden.test_mode!
    Warden.test_reset!
    Capybara.reset_sessions!

    if user.current_workspace_id.nil? && user.companies.any?
      user.update!(current_workspace_id: user.companies.first.id)
    end

    test_password = "Password123!"
    user.update!(password: test_password, password_confirmation: test_password)

    login_as(user, scope: :user)
    visit "/time-tracking"
    wait_for_react_app

    if page.has_field?("Email", wait: 1) && page.has_field?("Password", wait: 1)
      perform_ui_login(user.email, test_password)
      visit "/time-tracking"
      wait_for_react_app
    end

    expect(page).to have_no_current_path(%r{/users/sign_in}, wait: 10)
  end

  def wait_for_react_app
    expect(page).to have_css("#react-root", wait: 10)
  end

  def navigate_to_spa_page(path)
    visit path
    wait_for_react_app
  end

  def skip_react_app_for_functionality_test
    true
  end

  def sign_in_via_ui(user, password = "Password123!")
    Warden.test_mode!
    Warden.test_reset!
    Capybara.reset_sessions!
    perform_ui_login(user.email, password)
    visit "/time-tracking"
    wait_for_react_app
    expect(page).to have_current_path("/time-tracking", wait: 10)
  end

  private

    def perform_ui_login(email, password)
      visit "/users/sign_in"
      wait_for_react_app

      expect(page).to have_field("Email", wait: 15)
      expect(page).to have_field("Password", wait: 15)
      fill_in "Email", with: email
      fill_in "Password", with: password
      click_button "Sign In"
      wait_for_react_app
      expect(page).to have_no_current_path(%r{/users/sign_in}, wait: 15)
    end
end
