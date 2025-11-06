# frozen_string_literal: true

class CreateCurrencyPairs < ActiveRecord::Migration[7.1]
  def change
    create_table :currency_pairs do |t|
      t.string :from_currency, null: false
      t.string :to_currency, null: false
      t.decimal :rate, precision: 20, scale: 10
      t.datetime :last_updated_at
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :currency_pairs, [:from_currency, :to_currency], unique: true
    add_index :currency_pairs, :active
  end
end
