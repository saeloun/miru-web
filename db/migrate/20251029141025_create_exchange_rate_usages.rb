# frozen_string_literal: true

class CreateExchangeRateUsages < ActiveRecord::Migration[7.1]
  def change
    create_table :exchange_rate_usages do |t|
      t.integer :requests_count, default: 0
      t.date :month, null: false
      t.datetime :last_fetched_at

      t.timestamps
    end

    add_index :exchange_rate_usages, :month, unique: true
  end
end
