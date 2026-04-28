# frozen_string_literal: true

class PaymentsProvider < ApplicationRecord
  STRIPE_PROVIDER = "stripe"
  UPI_PROVIDER = "upi"
  PROVIDERS = [STRIPE_PROVIDER, UPI_PROVIDER].freeze
  UPI_ID_REGEX = /\A[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9._-]{2,64}\z/

  store_accessor :settings,
    :upi_id,
    :payee_name,
    :merchant_category_code,
    :enabled_on_invoices

  belongs_to :company

  before_validation :ensure_settings

  validates :name, uniqueness: { scope: :company_id }
  validates :name, inclusion: { in: PROVIDERS }
  validates :upi_id, format: { with: UPI_ID_REGEX }, allow_blank: true, if: :upi?
  validates :payee_name, length: { maximum: 100 }, allow_blank: true, if: :upi?
  validates :merchant_category_code, length: { maximum: 4 }, allow_blank: true, if: :upi?
  validate :upi_enabled_requires_upi_id, if: :upi?

  def upi?
    name == UPI_PROVIDER
  end

  def upi_configured?
    upi? && upi_id.present?
  end

  def enabled_on_invoices?
    return true unless settings.key?("enabled_on_invoices")

    ActiveModel::Type::Boolean.new.cast(enabled_on_invoices)
  end

  private

    def ensure_settings
      self.settings ||= {}
    end

    def upi_enabled_requires_upi_id
      return unless enabled? && upi_id.blank?

      errors.add(:upi_id, :blank)
    end
end
