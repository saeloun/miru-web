# frozen_string_literal: true

class CurrencyPair < ApplicationRecord
  validates :from_currency, presence: true
  validates :to_currency, presence: true
  validates :rate, numericality: { greater_than: 0 }, allow_nil: true
  validates :from_currency, uniqueness: { scope: :to_currency }

  scope :active, -> { where(active: true) }

  def self.get_rate(from_currency, to_currency)
    return 1.0 if from_currency == to_currency

    pair = active.find_by(from_currency:, to_currency:)
    return pair.rate if pair&.rate.present?

    inverse_pair = active.find_by(from_currency: to_currency, to_currency: from_currency)
    return nil unless inverse_pair&.rate.present? && inverse_pair.rate.positive?

    (1.0 / inverse_pair.rate).round(10)
  end
end
