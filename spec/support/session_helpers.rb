# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    with_forgery_protection do
      visit "/login"
      fill_in "Email", with: user.email
      fill_in "Password", with: user.password
      click_button "Sign In"
      sleep 5
    end
  end
end
