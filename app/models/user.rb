# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string           default(""), not null
#  last_name              :string           default(""), not null
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  role                   :integer          not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
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
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end
