# frozen_string_literal: true

module SessionHelpers
  def sign_in(user)
    within(".pt-20") do
      fill_in "email", with: user.email
      fill_in "password", with: user.password
    end
    click_button "Sign In"
  end
end
