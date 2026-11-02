# frozen_string_literal: true

module CompensationProfitabilityHelper
  def profitability_number(value, currency: nil, percent: false, precision: 2)
    return "N/A" if value.nil?
    return number_to_currency(value.to_d, unit: "#{currency} ", precision:) if currency

    "#{number_with_precision(value.to_d, precision:, delimiter: ',')}#{'%' if percent}"
  end
end
