# frozen_string_literal: true

class CreatePayments < ActiveRecord::Migration[7.0]
  def up
    create_table :payments do |t|
      t.references :invoice, null: false, foreign_key: true
      t.date :transaction_date, null: false
      t.text :note
      t.decimal :amount, scale: 2, precision: 20, default: 0.0
      t.integer :status, null: false
      t.integer :transaction_type, null: false

      t.timestamps
    end
  end

  def down
    drop_table :payments
  end
end
