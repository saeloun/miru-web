# frozen_string_literal: true

# == Schema Information
#
# Table name: exchange_rate_usages
#
#  id              :bigint           not null, primary key
#  last_fetched_at :datetime
#  month           :date             not null
#  requests_count  :integer          default(0)
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_exchange_rate_usages_on_month  (month) UNIQUE
#

class ExchangeRateUsage < ApplicationRecord
  validates :month, presence: true, uniqueness: true

  FREE_TIER_LIMIT = 1000
  WARNING_THRESHOLD = 0.7 # 70%

  scope :current_month, -> { where(month: Date.current.beginning_of_month) }

  def self.current
    current_month.first_or_create(month: Date.current.beginning_of_month)
  end

  def increment_usage!
    increment!(:requests_count)
    update(last_fetched_at: Time.current)
  end

  def usage_percentage
    (requests_count.to_f / FREE_TIER_LIMIT * 100).round(2)
  end

  def approaching_limit?
    usage_percentage >= (WARNING_THRESHOLD * 100)
  end

  def limit_exceeded?
    requests_count >= FREE_TIER_LIMIT
  end

  def remaining_requests
    FREE_TIER_LIMIT - requests_count
  end
end
