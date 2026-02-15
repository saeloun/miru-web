# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

class CurrencyConversionService
  class << self
    def get_exchange_rate(from_currency, to_currency, date = Date.current)
      from = from_currency.to_s.upcase
      to = to_currency.to_s.upcase
      return 1.0 if from == to

      cached_rate = ExchangeRate.rate_for(from, to, date)
      return cached_rate if cached_rate.present?

      fetch_and_store_rate(from, to, date)
    end

    private

      def fetch_and_store_rate(from_currency, to_currency, date)
        rate =
          fetch_from_exchangerate_api(from_currency, to_currency, date) ||
          fetch_from_ecb(from_currency, to_currency, date) ||
          fetch_from_fixer_io(from_currency, to_currency, date)

        return nil if rate.blank?

        ExchangeRate.set_rate(from_currency, to_currency, rate, date, "api")
        rate
      end

      def fetch_from_exchangerate_api(from_currency, to_currency, _date)
        response = request_json("https://api.exchangerate-api.com/v4/latest/#{from_currency}")
        response&.dig("rates", to_currency)&.to_f
      end

      def fetch_from_ecb(from_currency, to_currency, date)
        response = request_json("https://api.frankfurter.app/#{date}?from=#{from_currency}&to=#{to_currency}")
        response&.dig("rates", to_currency)&.to_f
      end

      def fetch_from_fixer_io(from_currency, to_currency, _date)
        api_key = ENV["FIXER_API_KEY"]
        return nil if api_key.blank?

        response = request_json(
          "https://data.fixer.io/api/latest?access_key=#{api_key}&base=#{from_currency}&symbols=#{to_currency}"
        )
        return nil unless response&.dig("success")

        response.dig("rates", to_currency)&.to_f
      end

      def request_json(url)
        uri = URI.parse(url)
        response = Net::HTTP.get_response(uri)
        return nil unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body)
      rescue StandardError
        nil
      end
  end

  def self.convert(amount, from_currency, to_currency, date = Date.current)
    new(amount:, from_currency:, to_currency:, date:).process
  end

  def initialize(amount:, from_currency:, to_currency:, date: Date.current)
    @amount = amount.presence || 0
    @from_currency = from_currency
    @to_currency = to_currency
    @date = date
  end

  def process
    return @amount if same_currency?

    convert_currency
  end

  private

    def same_currency?
      @from_currency.to_s.upcase == @to_currency.to_s.upcase
    end

    def convert_currency
      rate = self.class.get_exchange_rate(@from_currency, @to_currency, @date)
      return nil if rate.blank?

      (BigDecimal(@amount.to_s) * BigDecimal(rate.to_s)).round(2).to_f
    end
end
