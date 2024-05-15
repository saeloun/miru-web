# frozen_string_literal: true

class CreateCarryovers < ActiveRecord::Migration[7.1]
  def change
    create_table :carryovers do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.references :leave_type, null: false, foreign_key: true
      t.integer :from_year
      t.integer :to_year
      t.integer :total_leave_balance
      t.integer :duration
      t.datetime :discarded_at

      t.timestamps
    end
    add_index :carryovers, :discarded_at
  end
end
