# frozen_string_literal: true

module InvoicesHelper
  def format_currency(base_currency)
    base_currency.to_s.downcase
  end
end
