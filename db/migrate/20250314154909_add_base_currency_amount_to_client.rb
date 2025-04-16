# frozen_string_literal: true

class AddBaseCurrencyAmountToClient < ActiveRecord::Migration[7.1]
  def change
    add_column :invoices, :base_currency_amount, :decimal, precision: 20, scale: 2, default: 0.0
  end
end
