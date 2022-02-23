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
#  current_workspace_id   :integer
#  invitation_token       :string
#  invitation_created_at  :datetime
#  invitation_sent_at     :datetime
#  invitation_accepted_at :datetime
#  invitation_limit       :integer
#  invited_by_type        :string
#  invited_by_id          :integer
#  invitations_count      :integer          default("0")
#  discarded_at           :datetime
#
# Indexes
#
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_invitation_token      (invitation_token) UNIQUE
#  index_users_on_invited_by            (invited_by_type,invited_by_id)
#  index_users_on_invited_by_id         (invited_by_id)
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#

# frozen_string_literal: true

class User < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :current_workspace, class_name: "Company", foreign_key: :current_workspace_id, optional: true
  has_many :company_users, dependent: :destroy
  has_many :companies, through: :company_users
  has_many :project_members, dependent: :destroy
  has_many :timesheet_entries
  has_many :identities, dependent: :delete_all
  has_one_attached :avatar
  rolify strict: true

  # Validations
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :invitable, :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable, :confirmable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  # Callbacks
  after_discard :discard_project_members

  def primary_role
    return "employee" if roles.empty?

    roles.first.name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def active_for_authentication?
    super and self.kept?
  end

  def has_owner_or_admin_role?(company)
    return false if company.nil?

    self.has_cached_role?(:owner, company) || self.has_cached_role?(:admin, company)
  end

  private
    def discard_project_members
      project_members.discard_all
    end
end
