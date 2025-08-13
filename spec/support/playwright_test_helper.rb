# frozen_string_literal: true

module PlaywrightTestHelper
  def sign_in(user)
    login_as(user, scope: :user)
    visit "/"

    unless page.current_path != "/login"
      visit "/login"
      fill_in "email", with: user.email
      fill_in "password", with: user.password || "Test@Password123!"
      click_button "Sign In"
      sleep(2)
    end
  rescue => e
    puts "Sign in failed: #{e.message}"
  end

  def wait_for_element(selector, timeout: 5)
    Timeout.timeout(timeout) do
      loop do
        break if page.has_css?(selector)
        sleep 0.1
      end
    end
    true
  rescue Timeout::Error
    false
  end

  def safe_visit(path)
    visit path
    sleep(1)
    wait_for_element('[data-testid="app-loaded"]', timeout: 2)
  end
end

RSpec.configure do |config|
  config.include PlaywrightTestHelper, type: :system
end
