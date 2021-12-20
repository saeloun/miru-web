# frozen_string_literal: true

class Authentication::AuthenticateUser < ApplicationService
  attr_accessor :email, :password

  def initialize(email, password)
    @email = email
    @password = password
  end

  def process
    JsonWebToken.encode(user_id: user.id) if user
  end

  private
    def user
      user = User.find_by_email(email)
      return user if user && user.valid_password?(password)

      errors.add :user_authentication, "invalid credentials"
      nil
    end
end
