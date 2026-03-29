# frozen_string_literal: true

module SystemTestHelpers
  def wait_for_app_initialization
    expect(page).to have_css("#react-root, [data-testid='app-root'], [data-testid='app-loaded']", wait: 10)
  end

  def visit_and_wait(path)
    visit path
    wait_for_app_initialization
  end

  def fill_in_react(field, with:)
    field_element = find_field(field)
    field_element.fill_in(with: with)
    field_element.native.send_keys(:tab)
    expect(field_element.value).to eq(with)
  end

  def click_and_wait(text_or_selector)
    if text_or_selector.start_with?("[", ".", "#")
      find(text_or_selector).click
    else
      click_on text_or_selector
    end
    expect(page).to have_css("#react-root", wait: 10)
  end

  def wait_for_content(text, timeout: 10)
    expect(page).to have_content(text, wait: timeout)
  end

  def sign_up_user(first_name:, last_name:, email:, password:)
    visit "/signup"
    wait_for_app_initialization

    within("form") do
      fill_in "first_name", with: first_name
      fill_in "last_name", with: last_name
      fill_in "email", with: email
      fill_in "password", with: password
      fill_in "confirm_password", with: password
      find(:css, "#termsOfService", visible: false).set(true)

      click_button "Sign Up"
    end

    expect(page).to have_no_current_path("/signup", wait: 10)
  end

  def navigate_to_invoices
    sign_in(@user) if @user && !page.has_css?("#react-root", wait: 1)
    visit "/invoices"
    wait_for_content("Invoices", timeout: 10)
  end

  def navigate_to_time_tracking
    sign_in(@user) if @user && !page.has_css?("#react-root", wait: 1)
    visit "/time-tracking"
    wait_for_content("Time Tracking", timeout: 10)
  end
end

RSpec.configure do |config|
  config.include SystemTestHelpers, type: :system
  config.include Warden::Test::Helpers, type: :system

  config.before(:each, type: :system) do
    Capybara.default_max_wait_time = 5
    Warden.test_reset!
  end

  config.after(:each, type: :system) do
    Warden.test_reset!
  end
end
