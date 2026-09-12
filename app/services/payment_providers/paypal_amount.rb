# frozen_string_literal: true

module PaymentProviders
  class PaypalAmount
    def self.format(amount, currency)
      value = BigDecimal(amount.to_s)

      if PaymentsProvider::PAYPAL_ZERO_DECIMAL_CURRENCIES.include?(currency.to_s.upcase)
        # PayPal rejects decimals for these currencies. Round up so the capture always covers the invoice.
        value.ceil.to_i.to_s
      else
        Kernel.format("%.2f", value.round(2))
      end
    end

    def self.parse(value)
      BigDecimal(value.to_s)
    end
  end
end
