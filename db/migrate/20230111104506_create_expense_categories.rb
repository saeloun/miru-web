# frozen_string_literal: true

class CreateExpenseCategories < ActiveRecord::Migration[7.0]
  def change
    create_table :expense_categories do |t|
      t.string :name
      t.string :icon
      t.string :color
      t.boolean :default, default: false

      t.references :company, foreign_key: true
      t.timestamps
    end
  end
end
