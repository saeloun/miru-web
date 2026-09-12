# frozen_string_literal: true

module PaymentProviders
  class PaypalAmount
    def self.format(amount, currency)
      value = BigDecimal(amount.to_s)
      if PaymentsProvider::PAYPAL_ZERO_DECIMAL_CURRENCIES.include?(currency.to_s.upcase)
        value.round(0).to_i.to_s
      else
        value.round(2).to_s("F").then { |text| text.include?(".") ? text.ljust(text.index(".") + 3, "0") : "#{text}.00" }
      end
    end

    def self.parse(value)
      BigDecimal(value.to_s)
    end
  end
end
