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
