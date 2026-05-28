# frozen_string_literal: true

class QuickbooksConnection < ApplicationRecord
  TOKEN_EXPIRY_BUFFER = 2.minutes

  store_accessor :settings,
    :company_name,
    :income_account_id,
    :accounts_receivable_account_id,
    :deposit_account_id,
    :service_item_id,
    :tax_code_id

  enum :environment, {
    sandbox: 0,
    production: 1
  }

  enum :status, {
    connected: 0,
    refresh_failed: 1,
    disconnected: 2
  }

  belongs_to :company
  has_many :quickbooks_references, dependent: :destroy
  has_many :quickbooks_sync_runs, dependent: :destroy
  has_many :quickbooks_sync_events, dependent: :destroy

  before_validation :ensure_settings
  before_validation :set_connected_at, if: :connected?

  validates :environment, :status, presence: true
  validates :realm_id, length: { maximum: 100 }, allow_blank: true
  validates :company_name, length: { maximum: 255 }, allow_blank: true
  validates :income_account_id,
    :accounts_receivable_account_id,
    :deposit_account_id,
    :service_item_id,
    :tax_code_id,
    length: { maximum: 100 },
    allow_blank: true

  scope :active, -> { where(disconnected_at: nil).where.not(status: statuses.fetch("disconnected")) }

  def access_token
    decrypt_token(access_token_ciphertext)
  end

  def access_token=(value)
    self.access_token_ciphertext = encryptable_token(value)
  end

  def refresh_token
    decrypt_token(refresh_token_ciphertext)
  end

  def refresh_token=(value)
    self.refresh_token_ciphertext = encryptable_token(value)
  end

  def access_token_expired?
    access_token_expires_at.blank? || access_token_expires_at <= TOKEN_EXPIRY_BUFFER.from_now
  end

  def reconnect_required?
    refresh_failed? || refresh_token.blank?
  end

  def disconnect!
    update!(
      status: :disconnected,
      access_token: nil,
      refresh_token: nil,
      disconnected_at: Time.current
    )
  end

  def mapping_settings
    {
      income_account_id:,
      accounts_receivable_account_id:,
      deposit_account_id:,
      service_item_id:,
      tax_code_id:
    }
  end

  private

    def ensure_settings
      self.settings ||= {}
    end

    def set_connected_at
      self.connected_at ||= Time.current
    end

    def encryptable_token(value)
      return nil if value.blank?
      token_encryptor.encrypt_and_sign(value)
    end

    def decrypt_token(value)
      return nil if value.blank?
      token_encryptor.decrypt_and_verify(value)
    rescue ActiveSupport::MessageVerifier::InvalidSignature,
      ActiveSupport::MessageEncryptor::InvalidMessage
      nil
    end

    def token_encryptor
      ActiveSupport::MessageEncryptor.new(token_encryption_key)
    end

    def token_encryption_key
      Rails.application.key_generator.generate_key("quickbooks_connection_tokens", 32)
    end
end
