# frozen_string_literal: true

class CreateLeaveTypes < ActiveRecord::Migration[7.0]
  def change
    create_table :leave_types do |t|
      t.string :name, null: false
      t.integer :icon, null: false
      t.integer :color, null: false
      t.integer :allocation_value, null: false
      t.integer :allocation_period, null: false
      t.integer :allocation_frequency, null: false
      t.integer :carry_forward_days, null: false, default: 0

      t.timestamps
    end
  end
end
