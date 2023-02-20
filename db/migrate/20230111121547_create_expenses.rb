# frozen_string_literal: true

class CreateExpenses < ActiveRecord::Migration[7.0]
  def change
    create_table :expenses do |t|
      t.date :date, null: false
      t.decimal :amount, scale: 2, precision: 20, default: 0.0, null: false
      t.integer :expense_type
      t.text :description
      t.references :company, foreign_key: true, null: false
      t.references :expense_category, foreign_key: true, null: false
      t.references :vendor, foreign_key: true
      t.index :expense_type

      t.timestamps
    end
  end
end
