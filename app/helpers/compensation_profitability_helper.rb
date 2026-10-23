# frozen_string_literal: true

module CompensationProfitabilityHelper
  def profitability_number(value, currency: nil, percent: false)
    return "N/A" if value.nil?
    return number_to_currency(value.to_d, unit: "#{currency} ") if currency

    "#{number_with_precision(value.to_d, precision: 2, delimiter: ',')}#{'%' if percent}"
  end
end
