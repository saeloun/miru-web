# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  calendar_connected     :boolean          default(TRUE)
#  calendar_enabled       :boolean          default(TRUE)
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
#  provider               :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  sign_in_count          :integer          default(0), not null
#  social_accounts        :jsonb
#  token                  :string(50)
#  uid                    :string
#  unconfirmed_email      :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  current_workspace_id   :bigint
#  personal_email_id      :string
#
# Indexes
#
#  index_users_on_confirmation_token    (confirmation_token)
#  index_users_on_current_workspace_id  (current_workspace_id)
#  index_users_on_discarded_at          (discarded_at)
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_email_trgm            (email) USING gin
#  index_users_on_first_name_trgm       (first_name) USING gin
#  index_users_on_last_name_trgm        (last_name) USING gin
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (current_workspace_id => companies.id)
#

# frozen_string_literal: true
# typed: true

class User < ApplicationRecord
  extend T::Sig if defined?(T::Sig)
  include Discard::Model
  include Searchable
  include SuperAdmin

  # Configure pg_search
  pg_search_scope :pg_search,
    against: [:first_name, :last_name, :email],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "simple"
      },
      trigram: {
        threshold: 0.1
      }
    }

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
  has_secure_token :token, length: 50
  has_many :projects, through: :project_members
  has_many :clients, through: :projects
  has_many :client_members, dependent: :destroy
  has_many :timeoff_entries, dependent: :destroy
  has_many :custom_leave_users
  has_many :custom_leaves, through: :custom_leave_users, source: :custom_leave
  has_many :carryovers
  has_many :notification_preferences, dependent: :destroy

  rolify strict: true

  scope :with_kept_employments, -> { merge(Employment.kept) }
  scope :with_ids, -> (user_ids) { where(id: user_ids) if user_ids.present? }

  # Social account details
  store_accessor :social_accounts, :github_url, :linkedin_url

  # Attribute accessor
  attr_accessor :current_company, :role, :skip_password_validation

  # Validations
  after_initialize :set_default_social_accounts, if: :new_record?
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 20 }

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :trackable, :confirmable,
    :omniauthable, omniauth_providers: [:google_oauth2]

  # Devise session serialization fix
  def self.serialize_into_session(record)
    [record.id.to_s, record.authenticatable_salt]
  end

  def self.serialize_from_session(*args)
    # Handle both old and new session formats
    if args.length == 2
      key, salt = args
    elsif args.length > 2
      # Extract just the first two arguments (id and salt)
      key = args[0]
      salt = args[1]
    else
      return nil
    end

    record = find_by(id: key)
    record if record && record.authenticatable_salt == salt
  end

  # Callbacks
  after_discard :discard_project_members
  before_create :set_token

  after_commit :send_to_hubspot, on: :create

  def primary_role(company)
    roles = self.roles.where(resource: company)
    return "employee" if roles.empty?

    roles.first.name
  end

  def remove_roles_for(company)
    roles.each do | role |
      remove_role(role.name.to_sym, company)
    end
  end

  sig { returns(String) }
  def full_name
    "#{first_name} #{last_name}"
  end

  # Do user authentication if
  # 1. user is not soft deleted
  # AND
  # 2.1 user is part of atleast one active employment OR
  # 2.2 initial phase i.e, user is owner and setting up the company
  #     and hence no associated company
  sig { returns(T::Boolean) }
  def active_for_authentication?
    super and self.kept? and (!self.employments.kept.empty? or self.companies.empty?)
  end

  def inactive_message
    if self.employments.kept.empty? && self.kept?
      I18n.t("user.login.failure.disabled")
    else
      I18n.t("user.login.failure.pending_invitation")
    end
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

  def employed_at?(company_id)
    employments.kept.exists?(company_id:)
  end

  def avatar_url
    return nil unless avatar.attached?

    Rails.application.routes.url_helpers.polymorphic_url(avatar, only_path: true)
  end

  private

    def set_token
      self.token = SecureRandom.base58(50)
    end

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

    def send_to_hubspot
      HubspotIntegrationJob.perform_later(email, first_name, last_name)
    end
end
