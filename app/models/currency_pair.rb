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
  validates :from_currency, :to_currency, presence: true
  validates :from_currency, uniqueness: { scope: :to_currency }
  validates :rate, numericality: { greater_than: 0 }, allow_nil: true

  scope :active, -> { where(active: true) }

  def self.update_rate(from, to, rate)
    pair = find_or_create_by(from_currency: from.upcase, to_currency: to.upcase)
    pair.update(rate:, last_updated_at: Time.current)
  end

  def self.get_rate(from, to)
    active.find_by(from_currency: from.upcase, to_currency: to.upcase)&.rate
  end

  def self.configured_currencies
    active.pluck(:from_currency, :to_currency).flatten.uniq
  end
end
