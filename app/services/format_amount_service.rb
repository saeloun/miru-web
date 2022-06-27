# frozen_string_literal: true

class FormatAmountService
  attr_reader :amount, :currency

  def initialize(currency, amount)
    @amount = amount
    @currency = currency
  end

  def process
    Money.locale_backend = :currency
    Money.from_amount(amount, currency).format
  rescue Money::Currency::UnknownCurrency, ArgumentError
    amount.to_f
  end
end
