# frozen_string_literal: true

module SignupHelpers
  def accept_terms_of_service
    # Multiple strategies to check the terms checkbox since it's a custom component
    checkbox_checked = false

    # Strategy 1: Try to check using Capybara's check method
    begin
      check "termsOfService"
      checkbox_checked = true
    rescue StandardError
      # Continue to next strategy
    end

    # Strategy 2: Try to set the checkbox value directly
    unless checkbox_checked
      begin
        find("#termsOfService", visible: :all).set(true)
        checkbox_checked = true
      rescue StandardError
        # Continue to next strategy
      end
    end

    # Strategy 3: Click the checkbox element directly
    unless checkbox_checked
      begin
        find("#termsOfService", visible: :all).click
        checkbox_checked = true
      rescue StandardError
        # Continue to next strategy
      end
    end

    # Strategy 4: Use JavaScript as last resort
    unless checkbox_checked
      begin
        page.execute_script(<<~JS)
          const checkbox = document.getElementById('termsOfService');
          if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.dispatchEvent(new Event('click', { bubbles: true }));
          #{'  '}
            // Try to trigger React's onChange handler
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "checked").set;
            nativeInputValueSetter.call(checkbox, true);
            const ev2 = new Event('input', { bubbles: true});
            checkbox.dispatchEvent(ev2);
          }
        JS
        checkbox_checked = true
      rescue StandardError => e
        puts "Failed to check terms of service: #{e.message}"
      end
    end

    # Give React time to process the change
    sleep 0.1

    checkbox_checked
  end

  def fill_signup_form(user_data)
    fill_in "first_name", with: user_data[:first_name]
    fill_in "last_name", with: user_data[:last_name]
    fill_in "email", with: user_data[:email]
    fill_in "password", with: user_data[:password]
    fill_in "confirm_password", with: user_data[:confirm_password] || user_data[:password]
  end

  def wait_for_signup_form
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_css("form", wait: 10)
    # Extra wait for React to fully hydrate
    sleep 0.5
  end
end

RSpec.configure do |config|
  config.include SignupHelpers, type: :system
end
