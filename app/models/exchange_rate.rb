# frozen_string_literal: true

class ExchangeRate < ApplicationRecord
  validates :from_currency, presence: true
  validates :to_currency, presence: true
  validates :rate, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :date, uniqueness: { scope: [:from_currency, :to_currency] }

  scope :for_date, ->(date) { where(date: date) }
  scope :latest, -> { order(date: :desc).first }
  scope :between, ->(from, to) { where(from_currency: from, to_currency: to) }

  class << self
    # Get exchange rate for a specific date, falls back to latest available
    def rate_for(from_currency, to_currency, date = Date.current)
      return 1.0 if from_currency == to_currency

      # Try exact date first
      rate = between(from_currency, to_currency).for_date(date).first

      # Fall back to most recent rate before the date
      rate ||= between(from_currency, to_currency)
               .where("date <= ?", date)
               .order(date: :desc)
               .first

      # Try reverse rate if direct not found
      if rate.nil?
        reverse_rate = between(to_currency, from_currency)
                      .where("date <= ?", date)
                      .order(date: :desc)
                      .first
        return 1.0 / reverse_rate.rate if reverse_rate
      end

      rate&.rate
    end

    # Create or update rate for a date
    def set_rate(from_currency, to_currency, rate, date = Date.current, source = "manual")
      exchange_rate = find_or_initialize_by(
        from_currency: from_currency,
        to_currency: to_currency,
        date: date
      )
      exchange_rate.update!(rate: rate, source: source)
    end
  end
end
