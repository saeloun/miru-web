# frozen_string_literal: true

module ExchangeRates
  class HealthCheckService
    def initialize
      @issues = []
      @warnings = []
    end

    def check
      check_api_key
      check_database_rates
      check_fallback_rates
      check_usage_status
      check_recent_updates

      {
        healthy: @issues.empty? && @warnings.empty?,
        status: determine_status,
        issues: @issues,
        warnings: @warnings,
        details: {
          api_key_configured: api_key_configured?,
          database_rates_count: CurrencyPair.active.count,
          fallback_rates_available: fallback_rates_count,
          usage_percentage: current_usage_percentage,
          last_update: last_update_time
        }
      }
    end

    private

      def check_api_key
        unless api_key_configured?
          @warnings << "API key not configured. System will use fallback rates only."
        end
      end

      def check_database_rates
        active_pairs = CurrencyPair.active.count

        if active_pairs.zero?
          @warnings << "No active currency pairs in database. Run 'rails exchange_rates:discover' to set up."
        end

        pairs_without_rates = CurrencyPair.active.where(rate: nil).count
        if pairs_without_rates > 0
          @warnings << "#{pairs_without_rates} currency pairs have no rates. Run 'rails exchange_rates:fetch' to update."
        end
      end

      def check_fallback_rates
        # Fallback rates are always available from Money gem initializer
        # This is just informational
      end

      def check_usage_status
        usage = ExchangeRateUsage.current

        if usage.limit_exceeded?
          @issues << "Monthly API limit exceeded (#{usage.requests_count}/#{ExchangeRateUsage::FREE_TIER_LIMIT}). No new rates will be fetched until next month."
        elsif usage.approaching_limit?
          @warnings << "API usage approaching limit (#{usage.usage_percentage}%). Consider upgrading plan or reducing fetch frequency."
        end
      end

      def check_recent_updates
        latest_update = CurrencyPair.active.maximum(:last_updated_at)

        if latest_update.nil?
          @warnings << "No currency pairs have been updated yet. Rates may be stale."
        elsif latest_update < 2.days.ago
          @warnings << "Currency rates haven't been updated in #{time_ago_in_words(latest_update)}. Check if scheduled job is running."
        end
      end

      def determine_status
        return :critical if @issues.any?
        return :warning if @warnings.any?

        :healthy
      end

      def api_key_configured?
        ENV["OPEN_EXCHANGE_RATES_APP_ID"].present?
      end

      def fallback_rates_count
        # Count rates in Money gem's bank
        store = Money.default_bank.instance_variable_get(:@store)
        store&.instance_variable_get(:@rates)&.size || 0
      end

      def current_usage_percentage
        ExchangeRateUsage.current.usage_percentage
      end

      def last_update_time
        CurrencyPair.active.maximum(:last_updated_at)
      end

      def time_ago_in_words(time)
        seconds = Time.current - time
        case seconds
        when 0..59
          "#{seconds.to_i} seconds"
        when 60..3599
          "#{(seconds / 60).to_i} minutes"
        when 3600..86399
          "#{(seconds / 3600).to_i} hours"
        else
          "#{(seconds / 86400).to_i} days"
        end
      end
  end
end
