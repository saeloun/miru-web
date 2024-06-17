# frozen_string_literal: true

class CreateCustomLeaves < ActiveRecord::Migration[7.1]
  def change
    create_table :custom_leaves do |t|
      t.string :name, null: false
      t.integer :allocation_value, null: false
      t.integer :allocation_period, null: false
      t.references :leave, null: false, foreign_key: true

      t.timestamps
    end
  end
end
