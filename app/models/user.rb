# frozen_string_literal: true

class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  TOTP_ISSUER = "Miru"
  RECOVERY_CODES_COUNT = 8
  MAX_AVATAR_SIZE_MB = 5
  ALLOWED_AVATAR_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze

  if defined?(T::Sig)
    extend T::Sig
  else
    def self.sig(&block); end
  end
  include Discardable
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
  has_many :agents, dependent: :destroy
  has_many :identities, dependent: :delete_all
  has_many :previous_employments, dependent: :destroy
  has_one_attached :avatar
  has_many :addresses, as: :addressable, dependent: :destroy
  has_many :devices, dependent: :destroy
  has_many :passkeys, dependent: :destroy
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
  has_many :created_analytics_reports,
    class_name: "AnalyticsReport",
    foreign_key: :created_by_id,
    inverse_of: :creator,
    dependent: :destroy

  rolify strict: true

  scope :with_kept_employments, -> { merge(Employment.kept) }
  scope :with_ids, -> (user_ids) { where(id: user_ids) if user_ids.present? }

  # Social account details
  store_accessor :social_accounts, :github_url, :linkedin_url

  # Attribute accessor
  attribute :locale, :string, default: "en-US"
  attr_accessor :current_company, :role, :skip_password_validation

  # Validations
  after_initialize :set_default_social_accounts, if: :new_record?
  validates :first_name, :last_name,
    presence: true,
    format: { with: /\A[a-zA-Z\s]+\z/ },
    length: { maximum: 20 }
  validates :locale, inclusion: { in: LocaleConfig::SUPPORTED_LOCALES }
  validate :date_of_birth_cannot_be_in_future
  validate :phone_length_within_limit
  validate :validate_avatar_constraints
  validate :password_must_differ_from_current_password, if: :password_being_changed?

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable,
    :trackable, :confirmable, :lockable, :invitable,
    :session_limitable, :pwned_password, :jwt_authenticatable, :omniauthable,
    jwt_revocation_strategy: self,
    omniauth_providers: [:google_oauth2, :github]

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
  before_save :mark_password_changed_at, if: :will_save_change_to_encrypted_password?
  before_validation :normalize_locale
  before_validation :ensure_auth_extension_identifiers, on: :create

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

  def ensure_webauthn_id!
    return webauthn_id if webauthn_id.present?

    update!(webauthn_id: ::WebAuthn.generate_user_id)
    webauthn_id
  end

  def otp_secret
    self[:otp_secret_ciphertext]
  end

  def otp_secret=(value)
    self[:otp_secret_ciphertext] = value
  end

  def totp_enabled?
    otp_required_for_login? && otp_secret.present?
  end

  def has_second_factor_requirement?
    passkey_required_for_login? || totp_enabled?
  end

  def ensure_otp_secret!
    return otp_secret if otp_secret.present?

    update!(otp_secret: ::ROTP::Base32.random_base32)
    otp_secret
  end

  def reset_totp_setup!
    update!(
      otp_secret: ::ROTP::Base32.random_base32,
      otp_required_for_login: false,
      otp_last_used_at: nil,
      otp_recovery_codes_digest: [],
      otp_recovery_codes_generated_at: nil
    )
  end

  def totp_provisioning_uri
    return nil if otp_secret.blank?

    ::ROTP::TOTP.new(otp_secret, issuer: TOTP_ISSUER).provisioning_uri(email)
  end

  def verify_totp_code!(code)
    return false if otp_secret.blank?

    timestamp = ::ROTP::TOTP.new(otp_secret, issuer: TOTP_ISSUER).verify(
      normalized_otp_code(code),
      drift_behind: 30,
      drift_ahead: 30,
      after: otp_last_used_at
    )

    return false unless timestamp

    update!(otp_last_used_at: timestamp.to_i)
    true
  end

  def generate_recovery_codes!
    codes = Array.new(RECOVERY_CODES_COUNT) { SecureRandom.hex(4).upcase.scan(/.{1,4}/).join("-") }

    update!(
      otp_recovery_codes_digest: codes.map { |value| digest_recovery_code(value) },
      otp_recovery_codes_generated_at: Time.current
    )

    codes
  end

  def consume_recovery_code!(code)
    normalized = normalized_recovery_code(code)
    digest = digest_recovery_code(normalized)
    digests = Array(otp_recovery_codes_digest)
    return false unless digests.include?(digest)

    update!(otp_recovery_codes_digest: digests - [digest])
    true
  end

  def clear_totp!
    update!(
      otp_secret: nil,
      otp_required_for_login: false,
      otp_last_used_at: nil,
      otp_recovery_codes_digest: [],
      otp_recovery_codes_generated_at: nil
    )
  end

  private

    def validate_avatar_constraints
      return unless avatar.attached?

      if avatar.blob.byte_size > MAX_AVATAR_SIZE_MB.megabytes
        errors.add(:avatar, I18n.t("avatar.validation.file_too_large", size_mb: MAX_AVATAR_SIZE_MB))
      end

      return if ALLOWED_AVATAR_CONTENT_TYPES.include?(avatar.blob.content_type)

      errors.add(:avatar, I18n.t("avatar.validation.invalid_content_type"))
    end

    def normalize_locale
      self.locale = LocaleConfig.normalize(locale)
    end

    def ensure_auth_extension_identifiers
      self.jti ||= SecureRandom.uuid
      self.unique_session_id ||= SecureRandom.uuid
    end

    def mark_password_changed_at
      self.password_changed_at = Time.current
    end

    def date_of_birth_cannot_be_in_future
      return if date_of_birth.blank?
      return unless date_of_birth > Date.current

      errors.add(:date_of_birth, "cannot be in the future")
    end

    def password_being_changed?
      password.present? && current_password.present?
    end

    def password_must_differ_from_current_password
      return unless valid_password?(current_password)
      return unless password == current_password

      errors.add(:password, :same_as_current_password)
    end

    def phone_length_within_limit
      return if phone.blank?

      digits_count = phone.gsub(/\D/, "").length
      if digits_count < 2
        errors.add(:phone, "must contain at least 2 digits")
      elsif digits_count > 15
        errors.add(:phone, "cannot exceed 15 digits")
      end
    end

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
    rescue StandardError => error
      Rails.logger.warn("HubSpot signup enqueue failed for user_id=#{id}: #{error.class}: #{error.message}")
    end

    def normalized_otp_code(code)
      code.to_s.gsub(/\s+/, "")
    end

    def normalized_recovery_code(code)
      code.to_s.upcase.gsub(/[^A-Z0-9]/, "")
    end

    def digest_recovery_code(code)
      Digest::SHA256.hexdigest(normalized_recovery_code(code))
    end
end
