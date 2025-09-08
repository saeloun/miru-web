# frozen_string_literal: true

class CreateExchangeRates < ActiveRecord::Migration[8.0]
  def change
    create_table :exchange_rates do |t|
      t.string :from_currency, null: false
      t.string :to_currency, null: false
      t.decimal :rate, precision: 18, scale: 10, null: false
      t.date :date, null: false
      t.string :source, default: "manual"
      t.timestamps
    end

    add_index :exchange_rates, [:from_currency, :to_currency, :date], unique: true, name: "idx_exchange_rates_unique"
    add_index :exchange_rates, :date
    add_index :exchange_rates, [:from_currency, :to_currency]
  end
end
