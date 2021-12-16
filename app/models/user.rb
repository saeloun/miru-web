# frozen_string_literal: true

class User < ApplicationRecord
  enum role: { admin: 0, employee: 1 }, _default: "employee"

  validates :first_name, :last_name, :email, :encrypted_password, presence: true
  validates :first_name, :last_name, length: { maximum: 50 }
  validates :email, format: { with: /^([^\s]+)((?:[-a-z0-9]+\.)+[a-z]{2,})$/i, multiline: true }
  validates :encrypted_password, length: { minimum: 6 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end
