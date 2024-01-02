# frozen_string_literal: true

class CreateTimeoffEntries < ActiveRecord::Migration[7.0]
  def change
    create_table :timeoff_entries do |t|
      t.integer :duration, null: false
      t.text :note, default: ""
      t.date :leave_date, null: false

      t.timestamps
    end
  end
end
