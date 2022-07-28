# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  confirmation_sent_at   :datetime
#  confirmation_token     :string
#  confirmed_at           :datetime
#  current_sign_in_at     :datetime
#  current_sign_in_ip     :string
#  date_of_birth          :date
#  discarded_at           :datetime
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string           not null
#  last_name              :string           not null
#  last_sign_in_at        :datetime
#  last_sign_in_ip        :string
#  phone                  :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  social_accounts        :jsonb
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  personal_email_id      :string
#
# Indexes
#
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#

# frozen_string_literal: true

class User < ApplicationRecord
  include Discard::Model

  # Associations
  has_many :employments, dependent: :destroy
  has_many :companies, through: :employments
  has_many :project_members, dependent: :destroy
  has_many :timesheet_entries
  has_many :identities, dependent: :delete_all
  has_one :wise_account, dependent: :destroy
  has_many :previous_employments, dependent: :destroy
  has_one_attached :avatar
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :invitations, foreign_key: "sender_id", dependent: :destroy

  rolify strict: true

  # Social account details
  store_accessor :social_accounts, :github_url, :linkedin_url

  # Attribute accessor
  attr_accessor :current_company, :role, :skip_password_validation

  # Validations
  after_initialize :set_default_social_accounts, if: :new_record?
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 50 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :trackable, :confirmable,
    :omniauthable, omniauth_providers: [:google_oauth2]

  # Callbacks
  after_discard :discard_project_members

  # scopes
  scope :valid_invitations, -> { invitations.where(sender: self).valid_invitations }

  def primary_role(company)
    roles = self.roles.where(resource: company)
    return "employee" if roles.empty?

    roles.first.name
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def active_for_authentication?
    super and self.kept?
  end

  def current_workspace(load_associations: [:logo_attachment])
    @_current_workspace ||= Company.includes(load_associations).find_by(id: current_workspace_id)
  end

  def current_workspace=(workspace)
    write_attribute(:current_workspace_id, workspace&.id)
  end

  def assign_company_and_role
    return self.errors.add(:base, I18n.t("errors.internal_server_error")) if current_company.nil? || role.nil?

    ActiveRecord::Base.transaction do
      assign_company
      assign_role
    end
  end

  def create_reset_password_token
    raw, hashed = Devise.token_generator.generate(User, :reset_password_token)
    self.reset_password_token = hashed
    self.reset_password_sent_at = Time.now.utc
    self.save
    raw # This value will be used to redirect users to the reset password page
 end

  private

    def discard_project_members
      project_members.discard_all
    end

    def set_default_social_accounts
      self.social_accounts = {
        "github_url": "",
        "linkedin_url": ""
      }
    end

    def assign_company
      unless errors.present? ||
          companies.exists?(id: current_company.id)
        self.companies << current_company
      end
    end

    def assign_role
      if errors.empty? && current_company
        self.add_role(role.downcase.to_sym, current_company)
      end
    end

    def password_required?
      return false if skip_password_validation

      super
    end
end
