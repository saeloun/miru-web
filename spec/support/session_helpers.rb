# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    with_forgery_protection do
      visit "/login"

      within(".pt-20") do
        fill_in "email", with: user.email
        fill_in "password", with: user.password
      end
      click_button "Sign In"
      sleep 2
    end
  end
end
