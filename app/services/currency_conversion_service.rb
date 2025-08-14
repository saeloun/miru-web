# frozen_string_literal: true

require "net/http"
require "json"

class CurrencyConversionService
  class << self
    # Main conversion method
    def convert(amount, from_currency, to_currency, date = Date.current)
      return amount if from_currency == to_currency
      return 0 if amount.nil? || amount == 0

      rate = get_exchange_rate(from_currency, to_currency, date)
      return nil unless rate

      (amount * rate).round(2)
    end

    # Get exchange rate with caching
    def get_exchange_rate(from_currency, to_currency, date = Date.current)
      return 1.0 if from_currency == to_currency

      # Check database first
      rate = ExchangeRate.rate_for(from_currency, to_currency, date)
      return rate if rate

      # Fetch from API if not in database or too old
      fetch_and_store_rate(from_currency, to_currency, date)
    end

    # Fetch rate from external API and store in database
    def fetch_and_store_rate(from_currency, to_currency, date = Date.current)
      # Try multiple free APIs in order of preference
      rate = fetch_from_exchangerate_api(from_currency, to_currency, date) ||
             fetch_from_fixer_io(from_currency, to_currency, date) ||
             fetch_from_ecb(from_currency, to_currency, date)

      if rate
        ExchangeRate.set_rate(from_currency, to_currency, rate, date, "api")
        rate
      else
        Rails.logger.error "Failed to fetch exchange rate for #{from_currency} to #{to_currency}"
        nil
      end
    rescue => e
      Rails.logger.error "Exchange rate fetch error: #{e.message}"
      nil
    end

    # Update all rates for a base currency
    def update_rates_for_currency(base_currency, currencies = nil, date = Date.current)
      currencies ||= Invoice.distinct.pluck(:currency).compact.uniq
      currencies.each do |currency|
        next if currency == base_currency
        fetch_and_store_rate(currency, base_currency, date)
      end
    end

    private

      # ExchangeRate-API.com (free tier: 1500 requests/month)
      def fetch_from_exchangerate_api(from_currency, to_currency, date)
        # Free API doesn't support historical rates, only latest
        return nil unless date >= Date.current

        url = "https://api.exchangerate-api.com/v4/latest/#{from_currency}"
        response = fetch_json(url)
        return nil unless response && response["rates"]

        rate = response["rates"][to_currency]
        rate&.to_f
      rescue => e
        Rails.logger.warn "ExchangeRate-API fetch failed: #{e.message}"
        nil
      end

      # Fixer.io free tier (100 requests/month, EUR base only)
      def fetch_from_fixer_io(from_currency, to_currency, date)
        # Free tier only supports EUR as base
        return nil unless from_currency == "EUR" || to_currency == "EUR"

        # API key would need to be configured
        api_key = ENV["FIXER_API_KEY"]
        return nil unless api_key

        url = "http://data.fixer.io/api/#{date}?access_key=#{api_key}&symbols=#{from_currency},#{to_currency}"
        response = fetch_json(url)
        return nil unless response && response["success"] && response["rates"]

        if from_currency == "EUR"
          response["rates"][to_currency]&.to_f
        elsif to_currency == "EUR"
          1.0 / response["rates"][from_currency].to_f if response["rates"][from_currency]
        else
          # Convert through EUR
          from_rate = response["rates"][from_currency]&.to_f
          to_rate = response["rates"][to_currency]&.to_f
          (to_rate / from_rate) if from_rate && to_rate
        end
      rescue => e
        Rails.logger.warn "Fixer.io fetch failed: #{e.message}"
        nil
      end

      # European Central Bank (free, EUR base only)
      def fetch_from_ecb(from_currency, to_currency, date)
        # ECB only provides EUR-based rates
        return nil unless from_currency == "EUR" || to_currency == "EUR"

        url = "https://api.frankfurter.app/#{date}?from=EUR&to=#{from_currency},#{to_currency}"
        response = fetch_json(url)
        return nil unless response && response["rates"]

        if from_currency == "EUR"
          response["rates"][to_currency]&.to_f
        elsif to_currency == "EUR"
          1.0 / response["rates"][from_currency].to_f if response["rates"][from_currency]
        else
          # Convert through EUR
          from_rate = response["rates"][from_currency]&.to_f
          to_rate = response["rates"][to_currency]&.to_f
          (to_rate / from_rate) if from_rate && to_rate
        end
      rescue => e
        Rails.logger.warn "ECB/Frankfurter fetch failed: #{e.message}"
        nil
      end

      def fetch_json(url)
        uri = URI(url)
        response = Net::HTTP.get_response(uri)
        return nil unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body)
      rescue => e
        Rails.logger.warn "HTTP fetch failed for #{url}: #{e.message}"
        nil
      end
  end
end
