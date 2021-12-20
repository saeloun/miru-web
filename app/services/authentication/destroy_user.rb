# frozen_string_literal: true

class Authentication::DestroyUser < ApplicationService
  attr_reader :current_user

  def initialize(current_user)
    @current_user = current_user
  end

  def process
    if current_user.destroy
      { message: "User destroyed" }
    else
      { error: "User not destroyed" }
    end
  end
end
