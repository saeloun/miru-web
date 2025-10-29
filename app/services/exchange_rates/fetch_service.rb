# frozen_string_literal: true

module ExchangeRates
  class FetchService
    require "net/http"
    require "json"

    API_URL = "https://openexchangerates.org/api/latest.json"

    def initialize(auto_discover: true)
      @app_id = ENV["OPEN_EXCHANGE_RATES_APP_ID"]
      @usage = ExchangeRateUsage.current
      @auto_discover = auto_discover
    end

    def process
      return { success: false, error: "API key not configured" } if @app_id.blank?
      return { success: false, error: "Monthly limit exceeded" } if @usage.limit_exceeded?

      # Discover needed currency pairs before fetching
      discovery_result = discover_currency_pairs if @auto_discover

      fetch_and_update_rates.tap do |result|
        result[:discovery] = discovery_result if discovery_result
      end
    end

    private

      def fetch_and_update_rates
        uri = URI("#{API_URL}?app_id=#{@app_id}")
        response = Net::HTTP.get_response(uri)

        if response.is_a?(Net::HTTPSuccess)
          data = JSON.parse(response.body)
          updated_count = update_currency_pairs(data["rates"])
          @usage.increment_usage!

          check_usage_threshold

          {
            success: true,
            rates_updated: updated_count,
            total_currencies_available: data["rates"].keys.count,
            usage: @usage.usage_percentage
          }
        else
          { success: false, error: "API request failed: #{response.code}" }
        end
      rescue StandardError => e
        Rails.logger.error("Exchange rate fetch failed: #{e.message}")
        { success: false, error: e.message }
      end

      def update_currency_pairs(rates)
        base_currency = "USD" # Open Exchange Rates free tier uses USD as base
        updated_count = 0

        CurrencyPair.active.each do |pair|
          rate_updated = false

          if pair.from_currency == base_currency && rates[pair.to_currency]
            # Direct rate from USD
            pair.update(rate: rates[pair.to_currency], last_updated_at: Time.current)
            rate_updated = true
          elsif pair.to_currency == base_currency && rates[pair.from_currency]
            # Inverse rate to USD
            pair.update(rate: (1.0 / rates[pair.from_currency]), last_updated_at: Time.current)
            rate_updated = true
          elsif rates[pair.from_currency] && rates[pair.to_currency]
            # Cross rate calculation
            rate = rates[pair.to_currency] / rates[pair.from_currency]
            pair.update(rate:, last_updated_at: Time.current)
            rate_updated = true
          end

          updated_count += 1 if rate_updated
        end

        # Update Money gem's bank
        update_money_bank(rates)

        updated_count
      end

      def update_money_bank(rates)
        base_currency = "USD"

        CurrencyPair.active.each do |pair|
          if pair.rate.present?
            Money.default_bank.add_rate(pair.from_currency, pair.to_currency, pair.rate)
          end
        end
      end

      def check_usage_threshold
        if @usage.approaching_limit? && !already_notified_this_month?
          ExchangeRates::UsageNotificationService.new(@usage).notify_admins
          mark_as_notified
        end
      end

      def already_notified_this_month?
        Rails.cache.read("exchange_rate_usage_notified_#{@usage.month}").present?
      end

      def mark_as_notified
        Rails.cache.write(
          "exchange_rate_usage_notified_#{@usage.month}",
          true,
          expires_in: 1.month
        )
      end

      def discover_currency_pairs
        discovery_service = CurrencyPairDiscoveryService.new
        result = discovery_service.process

        Rails.logger.info(
          "Currency pair discovery: #{result[:total_pairs]} pairs found, " \
          "#{result[:activated]} activated, #{result[:deactivated]} deactivated"
        )

        result
      rescue StandardError => e
        Rails.logger.error("Currency pair discovery failed: #{e.message}")
        nil
      end
  end
end
