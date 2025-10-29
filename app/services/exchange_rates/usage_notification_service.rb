# frozen_string_literal: true

module ExchangeRates
  class UsageNotificationService
    def initialize(usage)
      @usage = usage
    end

    def notify_admins
      admin_users = User.joins(:roles).where(roles: { name: ["owner", "admin"] }).distinct

      admin_users.each do |admin|
        ExchangeRateUsageMailer.usage_warning(admin, @usage).deliver_later
      end

      Rails.logger.warn(
        "Exchange Rate API Usage Warning: #{@usage.usage_percentage}% used " \
        "(#{@usage.requests_count}/#{ExchangeRateUsage::FREE_TIER_LIMIT})"
      )
    end
  end
end
