# frozen_string_literal: true

class TestLoginController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!, raise: false
  skip_after_action :verify_authorized, raise: false

  def login
    user = User.find_by(email: "hello@saeloun.com")
    if user
      sign_in(user)
      redirect_to "/settings/leaves", notice: "Logged in successfully"
    else
      redirect_to root_path, alert: "User not found"
    end
  end
end
