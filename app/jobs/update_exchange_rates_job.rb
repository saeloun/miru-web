# frozen_string_literal: true

class UpdateExchangeRatesJob < ApplicationJob
  queue_as :default

  def perform
    # Auto-discover needed currency pairs before fetching
    result = ExchangeRates::FetchService.new(auto_discover: true).process

    if result[:success]
      log_message = "Exchange rates updated successfully. " \
                    "Your pairs updated: #{result[:rates_updated]}"

      if result[:total_currencies_available]
        log_message += " (API provides #{result[:total_currencies_available]} currencies)"
      end

      log_message += ", Usage: #{result[:usage]}%"

      if result[:discovery]
        log_message += ", Pairs discovered: #{result[:discovery][:total_pairs]} " \
                       "(#{result[:discovery][:activated]} activated, " \
                       "#{result[:discovery][:deactivated]} deactivated)"
      end

      Rails.logger.info(log_message)
    else
      Rails.logger.error("Failed to update exchange rates: #{result[:error]}")
    end
  end
end
