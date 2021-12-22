# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :integer          not null, primary key
#  first_name             :string           default(""), not null
#  last_name              :string           default(""), not null
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  reset_password_token   :string
#  reset_password_sent_at :datetime
#  remember_created_at    :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  role                   :integer          not null
#
# Indexes
#
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#

class User < ApplicationRecord
  enum role: { admin: 0, employee: 1 }, _default: "employee"

  validates :first_name, :last_name, :email, :encrypted_password, presence: true
  validates :first_name, :last_name, length: { maximum: 50 }
  validates :email, format: { with: /^([^\s]+)((?:[-a-z0-9]+\.)+[a-z]{2,})$/i, multiline: true }
  validates :encrypted_password, length: { minimum: 6 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
        :jwt_authenticatable,
        :registerable,
        :recoverable, :rememberable, :validatable,
        jwt_revocation_strategy: JwtDenylist
end
