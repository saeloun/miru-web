# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    visit new_user_session_path
    within("#new_user") do
      fill_in "Email", with: user.email
      fill_in "Password", with: user.password
    end
    click_button "SIGN IN"
  end
end
