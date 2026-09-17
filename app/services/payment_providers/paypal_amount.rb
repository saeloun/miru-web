# frozen_string_literal: true

module PaymentProviders
  class PaypalAmount
    class UnsupportedAmountError < StandardError; end

    def self.format(amount, currency)
      value = BigDecimal(amount.to_s)
      return Kernel.format("%.2f", value.round(2)) unless zero_decimal?(currency)

      unless value.frac.zero?
        raise UnsupportedAmountError,
          "PayPal cannot charge #{value.to_s('F')} #{currency.to_s.upcase} because the currency has no decimals"
      end

      value.to_i.to_s
    end

    def self.parse(value)
      BigDecimal(value.to_s)
    end

    def self.zero_decimal?(currency)
      PaymentsProvider::PAYPAL_ZERO_DECIMAL_CURRENCIES.include?(currency.to_s.upcase)
    end
  end
end
