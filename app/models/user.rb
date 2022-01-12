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
#  sign_in_count          :integer          default("0"), not null
#  current_sign_in_at     :datetime
#  last_sign_in_at        :datetime
#  current_sign_in_ip     :string
#  last_sign_in_ip        :string
#  confirmation_token     :string
#  confirmed_at           :datetime
#  confirmation_sent_at   :datetime
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  company_id             :integer
#  position               :string
#
# Indexes
#
#  index_users_on_company_id            (company_id)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#

# frozen_string_literal: true

class User < ApplicationRecord
  belongs_to :company, optional: true
  has_many :timesheet_entries
  rolify

  validates :first_name, :last_name, :email, :encrypted_password, presence: true
  validates :first_name, :last_name, length: { maximum: 50 }
  validates :email, format: { with: /^([^\s]+)((?:[-a-z0-9]+\.)+[a-z]{2,})$/i, multiline: true }
  validates :encrypted_password, length: { minimum: 6 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable, :confirmable

  after_create :assign_default_role

  private
    def assign_default_role
      self.add_role(:owner) if self.roles.blank?
    end
end
