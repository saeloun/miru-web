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
        response = fetch_with_retry(uri)

        if response.is_a?(Net::HTTPSuccess)
          data = JSON.parse(response.body)

          # Validate that rates is a Hash before processing
          unless data["rates"].is_a?(Hash)
            rates_type = data["rates"].class.name
            error_msg = "Invalid API response: 'rates' is #{rates_type}, expected Hash"

            Rails.logger.error(
              "#{error_msg}. Response payload: #{data.inspect.truncate(500)}"
            )

            return { success: false, error: error_msg }
          end

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

      def fetch_with_retry(uri, max_attempts: 3)
        attempt = 0
        base_delay = 0.5
        last_error = nil

        max_attempts.times do
          attempt += 1

          begin
            response = Net::HTTP.start(
              uri.host,
              uri.port,
              use_ssl: uri.scheme == "https",
              open_timeout: 5,
              read_timeout: 10
            ) do |http|
              request = Net::HTTP::Get.new(uri)
              http.request(request)
            end

            # Check if we should retry
            if should_retry?(response) && attempt < max_attempts
              retry_after = get_retry_after(response)
              delay = retry_after || (base_delay * (2**(attempt - 1)))

              Rails.logger.warn(
                "Exchange rate API returned #{response.code}, retrying in #{delay}s " \
                "(attempt #{attempt}/#{max_attempts})"
              )

              sleep(delay)
              next # Continue to next iteration
            end

            return response
          rescue Timeout::Error, Errno::ECONNRESET, Errno::ECONNREFUSED,
                 SocketError, Net::OpenTimeout, Net::ReadTimeout => e
            last_error = e

            if attempt < max_attempts
              delay = base_delay * (2**(attempt - 1))

              Rails.logger.warn(
                "Network error (#{e.class}): #{e.message}, retrying in #{delay}s " \
                "(attempt #{attempt}/#{max_attempts})"
              )

              sleep(delay)
              next # Continue to next iteration
            end
          end
        end

        # If we get here, all attempts failed
        if last_error
          Rails.logger.error(
            "Exchange rate fetch failed after #{max_attempts} attempts: #{last_error.message}"
          )
          raise last_error
        end
      end

      def should_retry?(response)
        # Retry on 5xx server errors or 429 rate limit
        response.code.to_i >= 500 || response.code.to_i == 429
      end

      def get_retry_after(response)
        # Honor Retry-After header if present
        retry_after = response["Retry-After"]
        return nil if retry_after.nil?

        # Retry-After can be seconds or HTTP date
        if retry_after.match?(/^\d+$/)
          retry_after.to_i
        else
          # Parse HTTP date and calculate seconds until then
          retry_time = Time.httpdate(retry_after) rescue nil
          retry_time ? [retry_time - Time.now, 0].max : nil
        end
      rescue StandardError
        nil
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
            src = rates[pair.from_currency].to_f
            next if src <= 0.0

            pair.update(rate: (1.0 / src), last_updated_at: Time.current)
            rate_updated = true
          elsif rates[pair.from_currency] && rates[pair.to_currency]
            # Cross rate calculation
            from = rates[pair.from_currency].to_f
            to = rates[pair.to_currency].to_f
            next if from <= 0.0 || to <= 0.0

            rate = to / from
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
          ::ExchangeRates::UsageNotificationService.new(@usage).notify_admins
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
        discovery_service = ExchangeRates::CurrencyPairDiscoveryService.new
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
