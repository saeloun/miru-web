# frozen_string_literal: true

class CurrencyConversionService
  def initialize(amount:, from_currency:, to_currency:)
    @amount = amount
    @from_currency = from_currency
    @to_currency = to_currency
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
      # Try to get rate from database first
      rate = CurrencyPair.get_rate(@from_currency.to_s.upcase, @to_currency.to_s.upcase)

      if rate.present?
        (@amount * rate).round(2)
      else
        # Fallback to Money gem
        convert_with_money_gem
      end
    end

    def convert_with_money_gem
      money = Money.from_amount(BigDecimal(@amount.to_s), @from_currency)
      converted = money.exchange_to(@to_currency)
      BigDecimal(converted.to_d.to_s).round(2)
    rescue Money::Bank::UnknownRate, Money::Currency::UnknownCurrency
      Rails.logger.warn(
        "Exchange rate not available for #{@from_currency} to #{@to_currency}. " \
        "Using original amount."
      )
      BigDecimal(@amount.to_s)
    end
end
