# frozen_string_literal: true

class PaymentsProvider < ApplicationRecord
  STRIPE_PROVIDER = "stripe"
  UPI_PROVIDER = "upi"
  RAZORPAY_PROVIDER = "razorpay"
  PROVIDERS = [STRIPE_PROVIDER, UPI_PROVIDER, RAZORPAY_PROVIDER].freeze
  UPI_ID_REGEX = /\A[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9._-]{2,64}\z/

  store_accessor :settings,
    :upi_id,
    :payee_name,
    :merchant_category_code,
    :enabled_on_invoices,
    :key_id,
    :linked_account_id,
    :platform_fee_percent,
    :route_transfers_enabled

  belongs_to :company

  before_validation :ensure_settings
  before_validation :normalize_razorpay_settings, if: :razorpay?

  validates :name, uniqueness: { scope: :company_id }
  validates :name, inclusion: { in: PROVIDERS }
  validates :upi_id, format: { with: UPI_ID_REGEX }, allow_blank: true, if: :upi?
  validates :payee_name, length: { maximum: 100 }, allow_blank: true, if: :upi?
  validates :merchant_category_code, length: { maximum: 4 }, allow_blank: true, if: :upi?
  validates :key_id, length: { maximum: 120 }, allow_blank: true, if: :razorpay?
  validates :key_secret, length: { maximum: 200 }, allow_blank: true, if: :razorpay?
  validates :linked_account_id, length: { maximum: 120 }, allow_blank: true, if: :razorpay?
  validates :platform_fee_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 30 }, allow_blank: true, if: :razorpay?
  validate :upi_enabled_requires_upi_id, if: :upi?
  validate :razorpay_enabled_requires_credentials, if: :razorpay?
  validate :route_transfers_require_linked_account, if: :razorpay?

  def upi?
    name == UPI_PROVIDER
  end

  def razorpay?
    name == RAZORPAY_PROVIDER
  end

  def upi_configured?
    upi? && upi_id.present?
  end

  def razorpay_configured?
    razorpay? && key_id.present? && key_secret.present?
  end

  def key_secret
    encrypted_key_secret = settings["key_secret_ciphertext"]
    return decrypt_key_secret(encrypted_key_secret) if encrypted_key_secret.present?

    settings["key_secret"]
  end

  def key_secret=(value)
    ensure_settings
    return if value.blank?

    settings.delete("key_secret")
    settings["key_secret_ciphertext"] = encrypt_key_secret(value)
  end

  def enabled_on_invoices?
    return true unless settings.key?("enabled_on_invoices")

    ActiveModel::Type::Boolean.new.cast(enabled_on_invoices)
  end

  def route_transfers_enabled?
    ActiveModel::Type::Boolean.new.cast(route_transfers_enabled)
  end

  private

    def ensure_settings
      self.settings ||= {}
    end

    def upi_enabled_requires_upi_id
      return unless enabled? && upi_id.blank?

      errors.add(:upi_id, :blank)
    end

    def normalize_razorpay_settings
      self.platform_fee_percent = "5" if platform_fee_percent.blank?
      self.platform_fee_percent = BigDecimal(platform_fee_percent).round(2).to_s("F")
    rescue ArgumentError
      platform_fee_percent
    end

    def razorpay_enabled_requires_credentials
      return unless enabled? && !razorpay_configured?

      errors.add(:base, "Razorpay key id and key secret are required")
    end

    def route_transfers_require_linked_account
      return unless route_transfers_enabled? && linked_account_id.blank?

      errors.add(:linked_account_id, :blank)
    end

    def encrypt_key_secret(value)
      key_secret_encryptor.encrypt_and_sign(value)
    end

    def decrypt_key_secret(value)
      key_secret_encryptor.decrypt_and_verify(value)
    rescue ActiveSupport::MessageVerifier::InvalidSignature,
      ActiveSupport::MessageEncryptor::InvalidMessage
      nil
    end

    def key_secret_encryptor
      ActiveSupport::MessageEncryptor.new(key_secret_encryption_key)
    end

    def key_secret_encryption_key
      Rails.application.key_generator.generate_key("payments_provider_key_secret", 32)
    end
end
