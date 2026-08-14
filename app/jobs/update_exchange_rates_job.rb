# frozen_string_literal: true

class UpdateExchangeRatesJob < ApplicationJob
  queue_as :default

  def perform
    currencies = (Invoice.distinct.pluck(:currency) + Client.distinct.pluck(:currency)).compact.uniq
    base_currencies = Company.distinct.pluck(:base_currency).compact.uniq

    base_currencies.each do |base_currency|
      currencies.each do |currency|
        next if currency == base_currency

        CurrencyConversionService.get_exchange_rate(currency, base_currency, Date.current)
      end
    end
  end
end
