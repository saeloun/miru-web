# frozen_string_literal: true

class AddBaseCurrencyToExpenses < ActiveRecord::Migration[8.1]
  def change
    add_column :expenses, :base_currency_amount, :decimal, precision: 20, scale: 2
    add_column :expenses, :exchange_rate, :decimal, precision: 18, scale: 10
    add_column :expenses, :exchange_rate_date, :date
  end
end
