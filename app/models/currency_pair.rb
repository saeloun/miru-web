# frozen_string_literal: true

# == Schema Information
#
# Table name: currency_pairs
#
#  id              :bigint           not null, primary key
#  active          :boolean          default(TRUE)
#  from_currency   :string           not null
#  last_updated_at :datetime
#  rate            :decimal(20, 10)
#  to_currency     :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_currency_pairs_on_active                         (active)
#  index_currency_pairs_on_from_currency_and_to_currency  (from_currency,to_currency) UNIQUE
#

class CurrencyPair < ApplicationRecord
  # Normalize currency codes before validation
  before_validation :normalize_currency_codes

  validates :from_currency, :to_currency, presence: true
  validates :from_currency, uniqueness: { scope: :to_currency }
  validates :rate, numericality: { greater_than: 0 }, allow_nil: true

  # Enforce 3-letter ISO currency code format
  validates :from_currency, :to_currency, format: {
    with: /\A[A-Z]{3}\z/,
    message: "must be a 3-letter uppercase ISO currency code"
  }

  # Reject self-pairs (e.g., USD to USD)
  validate :currencies_must_be_different

  scope :active, -> { where(active: true) }

  def self.update_rate(from, to, rate)
    pair = find_or_create_by(from_currency: from.upcase, to_currency: to.upcase)
    pair.update(rate:, last_updated_at: Time.current)
    pair
  end

  def self.get_rate(from, to)
    active.find_by(from_currency: from.upcase, to_currency: to.upcase)&.rate
  end

  def self.configured_currencies
    active.pluck(:from_currency, :to_currency).flatten.uniq
  end

  private

    def normalize_currency_codes
      self.from_currency = from_currency.to_s.strip.upcase if from_currency.present?
      self.to_currency = to_currency.to_s.strip.upcase if to_currency.present?
    end

    def currencies_must_be_different
      if from_currency.present? && to_currency.present? && from_currency == to_currency
        errors.add(:base, "From currency and to currency must be different")
      end
    end
end
